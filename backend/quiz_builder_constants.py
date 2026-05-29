"""Quiz builder constants and TAP personality validation."""

import json

LAYOUT_TYPES = frozenset({
    'swipe_carousel',
    'image_cards',
    'character_choice',
    'single_select',
    'multi_select',
    'budget_slider',
    'drag_visual_layout',
    'text_input',
    'result_reveal',
})

TAP_PERSONALITY_REQUIRED_KEYS = frozenset({
    'passion',
    'partner',
    'treasure',
    'fun',
    'basecamp',
    'adventure',
    'recharge',
    'graduation',
})

DEFAULT_LAYOUT_JSON = {
    'swipe_carousel': {'template': 'swipe_carousel', 'showSwipeHint': True},
    'image_cards': {'template': 'image_cards', 'cardStyle': 'image'},
    'character_choice': {'template': 'character_choice', 'showCharacters': True},
    'single_select': {'template': 'single_select', 'cardStyle': 'list'},
    'multi_select': {'template': 'multi_select', 'maxSelections': 3},
    'budget_slider': {'template': 'budget_slider'},
    'drag_visual_layout': {'template': 'drag_visual_layout'},
    'text_input': {'template': 'text_input'},
    'result_reveal': {'template': 'result_reveal'},
}

# Default layout per TAP question key when seeding template
TAP_QUESTION_LAYOUTS = {
    'passion': 'swipe_carousel',
    'partner': 'character_choice',
    'treasure': 'single_select',
    'fun': 'image_cards',
    'basecamp': 'single_select',
    'adventure': 'swipe_carousel',
    'recharge': 'single_select',
    'graduation': 'single_select',
}

TAP_QUESTION_ORDER = [
    'passion',
    'partner',
    'treasure',
    'fun',
    'basecamp',
    'adventure',
    'recharge',
    'graduation',
]


def default_layout_json(layout_type: str) -> str:
    payload = DEFAULT_LAYOUT_JSON.get(layout_type, {'template': layout_type})
    return json.dumps(payload)
