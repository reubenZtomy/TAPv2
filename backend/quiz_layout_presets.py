"""Screen layout presets for new quiz questions."""

from quiz_builder_constants import LAYOUT_TYPES

# Each preset seeds layout_json (and layout_type) when creating a question.
LAYOUT_PRESETS: list[dict] = [
    {
        'id': 'tap_passion_swipe',
        'name': 'TAP Passion — swipe carousel',
        'layout_type': 'swipe_carousel',
        'category': 'TAP personality',
        'description': 'Swipeable cards (field of study / passions). Matches default passion screen.',
        'layout': {
            'template': 'swipe_carousel',
            'presetId': 'tap_passion_swipe',
            'showSwipeHint': True,
            'elements': [],
        },
    },
    {
        'id': 'tap_partner_characters',
        'name': 'TAP Partner — character pick',
        'layout_type': 'character_choice',
        'category': 'TAP personality',
        'description': 'Character grid with confirm. Matches partner screen.',
        'layout': {
            'template': 'character_choice',
            'presetId': 'tap_partner_characters',
            'showCharacters': True,
            'elements': [],
        },
    },
    {
        'id': 'tap_treasure_list',
        'name': 'TAP Treasure — single select list',
        'layout_type': 'single_select',
        'category': 'TAP personality',
        'description': 'Vertical list of budget options.',
        'layout': {
            'template': 'single_select',
            'presetId': 'tap_treasure_list',
            'cardStyle': 'list',
            'elements': [],
        },
    },
    {
        'id': 'tap_fun_image_cards',
        'name': 'TAP Fun — image cards',
        'layout_type': 'image_cards',
        'category': 'TAP personality',
        'description': 'Image-based option cards in a grid.',
        'layout': {
            'template': 'image_cards',
            'presetId': 'tap_fun_image_cards',
            'cardStyle': 'image',
            'elements': [],
        },
    },
    {
        'id': 'tap_basecamp_list',
        'name': 'TAP Basecamp — single select',
        'layout_type': 'single_select',
        'category': 'TAP personality',
        'description': 'List select for basecamp / city preference.',
        'layout': {
            'template': 'single_select',
            'presetId': 'tap_basecamp_list',
            'cardStyle': 'list',
            'elements': [],
        },
    },
    {
        'id': 'tap_adventure_swipe',
        'name': 'TAP Adventure — swipe carousel',
        'layout_type': 'swipe_carousel',
        'category': 'TAP personality',
        'description': 'Swipe carousel for adventure / ranking style questions.',
        'layout': {
            'template': 'swipe_carousel',
            'presetId': 'tap_adventure_swipe',
            'showSwipeHint': True,
            'elements': [],
        },
    },
    {
        'id': 'tap_recharge_list',
        'name': 'TAP Recharge — single select',
        'layout_type': 'single_select',
        'category': 'TAP personality',
        'description': 'List select for downtime / recharge.',
        'layout': {
            'template': 'single_select',
            'presetId': 'tap_recharge_list',
            'cardStyle': 'list',
            'elements': [],
        },
    },
    {
        'id': 'tap_graduation_list',
        'name': 'TAP Graduation — single select',
        'layout_type': 'single_select',
        'category': 'TAP personality',
        'description': 'Final single-select before results.',
        'layout': {
            'template': 'single_select',
            'presetId': 'tap_graduation_list',
            'cardStyle': 'list',
            'elements': [],
        },
    },
    {
        'id': 'generic_single_select',
        'name': 'Generic — single select list',
        'layout_type': 'single_select',
        'category': 'Generic',
        'description': 'Simple vertical list of text options.',
        'layout': {
            'template': 'single_select',
            'presetId': 'generic_single_select',
            'cardStyle': 'list',
            'elements': [],
        },
    },
    {
        'id': 'generic_multi_select',
        'name': 'Generic — multi select',
        'layout_type': 'multi_select',
        'category': 'Generic',
        'description': 'Pick up to 3 options.',
        'layout': {
            'template': 'multi_select',
            'presetId': 'generic_multi_select',
            'maxSelections': 3,
            'elements': [],
        },
    },
    {
        'id': 'generic_image_cards',
        'name': 'Generic — image cards',
        'layout_type': 'image_cards',
        'category': 'Generic',
        'description': 'Grid of image cards.',
        'layout': {
            'template': 'image_cards',
            'presetId': 'generic_image_cards',
            'cardStyle': 'image',
            'elements': [],
        },
    },
    {
        'id': 'generic_swipe_carousel',
        'name': 'Generic — swipe carousel',
        'layout_type': 'swipe_carousel',
        'category': 'Generic',
        'description': 'Horizontal swipe cards with hint.',
        'layout': {
            'template': 'swipe_carousel',
            'presetId': 'generic_swipe_carousel',
            'showSwipeHint': True,
            'elements': [],
        },
    },
    {
        'id': 'generic_character_choice',
        'name': 'Generic — character choice',
        'layout_type': 'character_choice',
        'category': 'Generic',
        'description': 'Character or mascot picker.',
        'layout': {
            'template': 'character_choice',
            'presetId': 'generic_character_choice',
            'showCharacters': True,
            'elements': [],
        },
    },
    {
        'id': 'generic_text_input',
        'name': 'Generic — text input',
        'layout_type': 'text_input',
        'category': 'Generic',
        'description': 'Free-text answer field.',
        'layout': {
            'template': 'text_input',
            'presetId': 'generic_text_input',
            'elements': [],
        },
    },
    {
        'id': 'blank_overlay',
        'name': 'Blank screen + overlays',
        'layout_type': 'single_select',
        'category': 'Custom',
        'description': 'Minimal base; add text, images, and buttons in the screen editor.',
        'layout': {
            'template': 'single_select',
            'presetId': 'blank_overlay',
            'cardStyle': 'list',
            'elements': [],
        },
    },
]


def list_layout_presets() -> list[dict]:
    return [
        p for p in LAYOUT_PRESETS
        if p['layout_type'] in LAYOUT_TYPES
    ]


def get_layout_preset(preset_id: str) -> dict | None:
    for p in LAYOUT_PRESETS:
        if p['id'] == preset_id:
            return p
    return None
