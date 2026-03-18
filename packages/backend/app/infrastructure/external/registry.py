# pyright: reportMissingModuleSource=false

from __future__ import annotations

from pathlib import Path
from typing import TypedDict, cast

import yaml

from app.domain.pricing.ports import PlatformAdapter
from app.domain.pricing.value_objects import PlatformConfig
from .adapters.stub import StubAdapter


class PlatformConfigRequiredPayload(TypedDict):
    base_url: str
    adapter_type: str


class PlatformConfigPayload(PlatformConfigRequiredPayload, total=False):
    display_name: str
    search_url_template: str
    enabled: bool


class PlatformsPayload(TypedDict, total=False):
    platforms: dict[str, PlatformConfigPayload]

_ADAPTER_CLASSES: dict[str, type[StubAdapter]] = {
    "stub": StubAdapter,
}


class PlatformRegistry:
    _platforms: dict[str, PlatformConfig]
    _adapters: dict[str, PlatformAdapter]

    def __init__(self) -> None:
        self._platforms = {}
        self._adapters = {}

    @classmethod
    def from_yaml(cls, config_path: str | Path) -> "PlatformRegistry":
        path = Path(config_path)
        with path.open("r", encoding="utf-8") as file:
            loaded = cast(object, yaml.safe_load(file))

        raw: PlatformsPayload = {"platforms": _load_platforms(loaded)}

        registry = cls()
        platforms_raw = raw.get("platforms", {})

        for platform_id, platform_data in platforms_raw.items():
            config = PlatformConfig(
                name=platform_id,
                base_url=platform_data["base_url"],
                search_url_template=platform_data.get("search_url_template", ""),
                enabled=platform_data.get("enabled", True),
                adapter_type=platform_data["adapter_type"],
            )
            registry._platforms[platform_id] = config

            if config.enabled:
                adapter_cls = _ADAPTER_CLASSES.get(config.adapter_type)
                if adapter_cls is not None:
                    registry._adapters[platform_id] = adapter_cls(config)

        return registry

    def all_enabled(self) -> dict[str, PlatformAdapter]:
        return dict(self._adapters)

    def get(self, platform_id: str) -> PlatformAdapter | None:
        return self._adapters.get(platform_id)


def _load_platforms(loaded: object) -> dict[str, PlatformConfigPayload]:
    if not isinstance(loaded, dict):
        return {}

    loaded_dict = cast(dict[object, object], loaded)
    platforms_obj = loaded_dict.get("platforms", {})
    if not isinstance(platforms_obj, dict):
        return {}

    typed_platforms: dict[str, PlatformConfigPayload] = {}
    platforms_dict = cast(dict[object, object], platforms_obj)
    for platform_id_obj, platform_data_obj in platforms_dict.items():
        if not isinstance(platform_id_obj, str) or not isinstance(platform_data_obj, dict):
            continue

        platform_data = cast(dict[object, object], platform_data_obj)
        base_url = platform_data.get("base_url")
        adapter_type = platform_data.get("adapter_type")
        if not isinstance(base_url, str) or not isinstance(adapter_type, str):
            continue

        payload: PlatformConfigPayload = {
            "base_url": base_url,
            "adapter_type": adapter_type,
        }

        search_url_template = platform_data.get("search_url_template")
        if isinstance(search_url_template, str):
            payload["search_url_template"] = search_url_template

        enabled = platform_data.get("enabled")
        if isinstance(enabled, bool):
            payload["enabled"] = enabled

        display_name = platform_data.get("display_name")
        if isinstance(display_name, str):
            payload["display_name"] = display_name

        typed_platforms[platform_id_obj] = payload

    return typed_platforms
