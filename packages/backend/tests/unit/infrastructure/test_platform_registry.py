# pyright: reportMissingImports=false, reportUnknownMemberType=false, reportUnknownVariableType=false, reportUnknownArgumentType=false

from __future__ import annotations

import tempfile
from pathlib import Path

from app.infrastructure.external.adapters.stub import StubAdapter
from app.infrastructure.external.registry import PlatformRegistry


SAMPLE_YAML = """\
platforms:
  stub_coupang:
    display_name: "쿠팡 (Stub)"
    base_url: "https://www.coupang.com"
    search_url_template: "{base_url}/np/search?q={query}"
    enabled: true
    adapter_type: stub
  stub_naver:
    display_name: "네이버쇼핑 (Stub)"
    base_url: "https://search.shopping.naver.com"
    search_url_template: "{base_url}/search/all?query={query}"
    enabled: true
    adapter_type: stub
  disabled_platform:
    display_name: "Disabled"
    base_url: "https://disabled.example.com"
    enabled: false
    adapter_type: stub
"""


def write_yaml(content: str) -> Path:
    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False)
    _ = tmp.write(content)
    tmp.close()
    return Path(tmp.name)


class TestPlatformRegistry:
    def test_loads_enabled_adapters_from_yaml(self) -> None:
        path = write_yaml(SAMPLE_YAML)
        registry = PlatformRegistry.from_yaml(path)

        enabled = registry.all_enabled()

        assert len(enabled) == 2
        assert "stub_coupang" in enabled
        assert "stub_naver" in enabled
        assert "disabled_platform" not in enabled

    def test_adapters_are_stub_instances(self) -> None:
        path = write_yaml(SAMPLE_YAML)
        registry = PlatformRegistry.from_yaml(path)

        for adapter in registry.all_enabled().values():
            assert isinstance(adapter, StubAdapter)

    def test_get_returns_adapter_or_none(self) -> None:
        path = write_yaml(SAMPLE_YAML)
        registry = PlatformRegistry.from_yaml(path)

        assert registry.get("stub_coupang") is not None
        assert registry.get("disabled_platform") is None
        assert registry.get("nonexistent") is None

    def test_empty_yaml_returns_empty_registry(self) -> None:
        path = write_yaml("platforms: {}")
        registry = PlatformRegistry.from_yaml(path)

        assert registry.all_enabled() == {}
