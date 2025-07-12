"""
Web Design Enhancer module for ParadoxGPT.

This module provides specialized functions for enhancing web design tasks
with creative and modern design patterns.
"""

import re
from typing import Dict, Any, Tuple, List

# Modern design trends and patterns
DESIGN_TRENDS = [
    "Neumorphism", "Glassmorphism", "Dark Mode", "Microinteractions", 
    "3D Elements", "Abstract Gradients", "Asymmetrical Layouts",
    "Animated Illustrations", "Minimalism", "Maximalism", "Retro/Vintage",
    "Cyberpunk", "Eco/Nature-inspired", "Brutalism", "Memphis Design"
]

# Color palettes with names and hex codes
COLOR_PALETTES = {
    "Midnight Dream": ["#0F2027", "#203A43", "#2C5364", "#FFFFFF", "#4ECDC4"],
    "Sunset Vibes": ["#FF9966", "#FF5E62", "#FFFFFF", "#011627", "#FDFFFC"],
    "Neo Mint": ["#00FF8C", "#00D672", "#FFFFFF", "#333333", "#F2F2F2"],
    "Cyberpunk": ["#F706CF", "#FFBC01", "#140021", "#2D00F7", "#E6E6FA"],
    "Nordic Frost": ["#E3F6F5", "#BAE8E8", "#2C698D", "#272643", "#FFFFFF"],
    "Earthy Tones": ["#D4A373", "#FEFAE0", "#FAEDCD", "#E9EDC9", "#CCD5AE"],
    "Electric Violet": ["#4776E6", "#8E54E9", "#FFFFFF", "#191919", "#FAFAFA"],
    "Coral Reef": ["#FF8C61", "#FF5A5F", "#FFFFFF", "#084C61", "#DB504A"]
}

# Animation effects with descriptions
ANIMATION_EFFECTS = {
    "Fade In": "Elements gracefully fade into view when the page loads",
    "Slide Up": "Elements slide upward into their position",
    "Scale In": "Elements start small and scale to full size",
    "Bounce": "Elements bounce slightly when appearing or on hover",
    "Rotate In": "Elements rotate into position",
    "Staggered Reveal": "Elements appear one after another in sequence",
    "Parallax Scrolling": "Background moves at a different speed than foreground",
    "Hover Lift": "Elements lift slightly on hover with shadow enhancement",
    "Text Scramble": "Text appears with a scrambling effect",
    "Gradient Flow": "Background gradient shifts and flows continuously"
}

# Modern UI components
UI_COMPONENTS = {
    "Floating Labels": "Input labels that float above the field when text is entered",
    "Skeleton Loaders": "Placeholder animations that show while content loads",
    "Toast Notifications": "Small, non-intrusive notification popups",
    "Backdrop Blur": "Blurred background behind modal elements",
    "Morphing Buttons": "Buttons that change shape or form during interaction",
    "Gradient Borders": "Borders with gradient colors instead of solid colors",
    "Animated Icons": "Icons with subtle animations on hover or click",
    "Custom Cursors": "Specialized cursor styles that change based on context",
    "Scroll-triggered Animations": "Elements that animate as they scroll into view",
    "Floating Action Buttons": "Buttons that float above the content"
}

def analyze_html(html_content: str) -> Dict[str, Any]:
    """
    Analyze HTML content to determine its current design characteristics.
    
    Args:
        html_content: The HTML content to analyze
        
    Returns:
        A dictionary containing analysis results
    """
    analysis = {
        "has_css": "<style" in html_content or "link rel=\"stylesheet\"" in html_content,
        "has_javascript": "<script" in html_content,
        "has_responsive_design": "media" in html_content or "@media" in html_content,
        "has_animations": "animation" in html_content or "transition" in html_content,
        "has_flexbox": "display: flex" in html_content or "display:flex" in html_content,
        "has_grid": "display: grid" in html_content or "display:grid" in html_content,
        "has_custom_fonts": "@font-face" in html_content or "font-family" in html_content,
        "has_icons": "fa-" in html_content or "icon" in html_content,
        "has_forms": "<form" in html_content,
        "has_images": "<img" in html_content or "background-image" in html_content,
        "color_count": len(re.findall(r'#[0-9a-fA-F]{3,6}', html_content)),
        "estimated_complexity": _estimate_complexity(html_content)
    }
    
    return analysis

def _estimate_complexity(html_content: str) -> str:
    """
    Estimate the complexity of the HTML content.
    
    Args:
        html_content: The HTML content to analyze
        
    Returns:
        A string indicating the complexity level
    """
    # Count elements, styles, and scripts
    element_count = len(re.findall(r'<[a-zA-Z][^>]*>', html_content))
    style_count = len(re.findall(r'{[^}]*}', html_content))
    script_lines = len(re.findall(r'\n', ''.join(re.findall(r'<script[^>]*>(.*?)</script>', html_content, re.DOTALL))))
    
    total_complexity = element_count + style_count + script_lines
    
    if total_complexity < 50:
        return "simple"
    elif total_complexity < 200:
        return "moderate"
    else:
        return "complex"

def generate_design_recommendations(html_content: str) -> Dict[str, Any]:
    """
    Generate design recommendations based on HTML analysis.
    
    Args:
        html_content: The HTML content to analyze
        
    Returns:
        A dictionary containing design recommendations
    """
    analysis = analyze_html(html_content)
    
    # Determine what's missing or could be improved
    recommendations = {
        "suggested_trends": _select_design_trends(analysis),
        "suggested_palette": _select_color_palette(analysis),
        "suggested_animations": _select_animations(analysis),
        "suggested_components": _select_ui_components(analysis),
        "improvement_areas": _identify_improvement_areas(analysis)
    }
    
    return recommendations

def _select_design_trends(analysis: Dict[str, Any]) -> List[str]:
    """Select appropriate design trends based on analysis."""
    import random
    # Choose 2-3 compatible design trends
    if analysis["estimated_complexity"] == "simple":
        # For simple designs, suggest more visual enhancements
        return random.sample(["Neumorphism", "Glassmorphism", "Minimalism", 
                             "Abstract Gradients", "Microinteractions"], 2)
    elif analysis["estimated_complexity"] == "moderate":
        # For moderate complexity, balance visual with functional
        return random.sample(["Dark Mode", "Animated Illustrations", 
                             "Asymmetrical Layouts", "Microinteractions"], 2)
    else:
        # For complex designs, focus on organization and clarity
        return random.sample(["Minimalism", "Dark Mode", "Microinteractions"], 2)

def _select_color_palette(analysis: Dict[str, Any]) -> Dict[str, List[str]]:
    """Select an appropriate color palette based on analysis."""
    import random
    # Choose a random palette for variety
    palette_name = random.choice(list(COLOR_PALETTES.keys()))
    return {palette_name: COLOR_PALETTES[palette_name]}

def _select_animations(analysis: Dict[str, Any]) -> Dict[str, str]:
    """Select appropriate animations based on analysis."""
    import random
    
    # If already has animations, suggest more subtle ones
    if analysis["has_animations"]:
        animation_types = ["Fade In", "Staggered Reveal", "Hover Lift"]
    else:
        animation_types = ["Fade In", "Slide Up", "Scale In", "Hover Lift"]
    
    # Select 2-3 animation types
    selected_types = random.sample(animation_types, min(3, len(animation_types)))
    
    return {anim_type: ANIMATION_EFFECTS[anim_type] for anim_type in selected_types}

def _select_ui_components(analysis: Dict[str, Any]) -> Dict[str, str]:
    """Select appropriate UI components based on analysis."""
    import random
    
    suggested_components = {}
    
    # If has forms, suggest form-related components
    if analysis["has_forms"]:
        form_components = ["Floating Labels", "Morphing Buttons"]
        selected = random.sample(form_components, min(2, len(form_components)))
        for comp in selected:
            suggested_components[comp] = UI_COMPONENTS[comp]
    
    # General UI components
    general_components = ["Toast Notifications", "Backdrop Blur", 
                         "Gradient Borders", "Animated Icons", 
                         "Scroll-triggered Animations"]
    
    # Select 2-3 general components
    selected = random.sample(general_components, min(2, len(general_components)))
    for comp in selected:
        suggested_components[comp] = UI_COMPONENTS[comp]
    
    return suggested_components

def _identify_improvement_areas(analysis: Dict[str, Any]) -> List[str]:
    """Identify areas for improvement based on analysis."""
    improvements = []
    
    if not analysis["has_responsive_design"]:
        improvements.append("Add responsive design for mobile devices")
    
    if not analysis["has_animations"]:
        improvements.append("Add subtle animations to improve user engagement")
    
    if not analysis["has_flexbox"] and not analysis["has_grid"]:
        improvements.append("Use modern CSS layout techniques (Flexbox/Grid)")
    
    if analysis["color_count"] < 3:
        improvements.append("Expand the color palette for visual interest")
    
    if not analysis["has_custom_fonts"]:
        improvements.append("Add custom typography to enhance brand identity")
    
    # Always suggest these improvements for better design
    improvements.append("Enhance visual hierarchy to guide user attention")
    improvements.append("Improve micro-interactions for better user feedback")
    
    return improvements

def generate_creative_prompt_enhancement(html_content: str) -> str:
    """
    Generate a creative prompt enhancement for web design tasks.
    
    Args:
        html_content: The HTML content to enhance
        
    Returns:
        A string containing specific creative instructions
    """
    recommendations = generate_design_recommendations(html_content)
    
    # Build a detailed creative prompt
    prompt = "CREATIVE WEB DESIGN ENHANCEMENT INSTRUCTIONS:\n\n"
    
    # Add design trends
    prompt += "DESIGN TRENDS TO INCORPORATE:\n"
    for trend in recommendations["suggested_trends"]:
        prompt += f"- {trend}\n"
    
    # Add color palette
    palette_name = list(recommendations["suggested_palette"].keys())[0]
    colors = recommendations["suggested_palette"][palette_name]
    prompt += f"\nCOLOR PALETTE - {palette_name}:\n"
    for i, color in enumerate(colors):
        prompt += f"- Color {i+1}: {color}\n"
    
    # Add animations
    prompt += "\nANIMATION EFFECTS TO ADD:\n"
    for anim_type, description in recommendations["suggested_animations"].items():
        prompt += f"- {anim_type}: {description}\n"
    
    # Add UI components
    prompt += "\nMODERN UI COMPONENTS TO IMPLEMENT:\n"
    for component, description in recommendations["suggested_components"].items():
        prompt += f"- {component}: {description}\n"
    
    # Add improvement areas
    prompt += "\nSPECIFIC IMPROVEMENTS TO MAKE:\n"
    for improvement in recommendations["improvement_areas"]:
        prompt += f"- {improvement}\n"
    
    # Add general creative direction
    prompt += """
CREATIVE DIRECTION:
- Transform this design into a visually stunning, modern interface
- Focus on creating a unique, memorable user experience
- Balance aesthetic beauty with functional usability
- Add thoughtful details that delight users
- Ensure the design feels cohesive and purposeful
- Use modern CSS techniques (variables, animations, transforms)
- Implement a clear visual hierarchy
- Consider accessibility while maintaining creative design

IMPORTANT: Don't just make minor tweaks - reimagine this design while maintaining its core functionality. Be bold and creative!
"""
    
    return prompt
