"""
Task Analyzer module for ParadoxGPT.

This module analyzes user tasks to determine the appropriate level of creativity
and the type of task (frontend, backend, etc.) to guide the generation process.
"""

from typing import Dict, Any, Tuple

# Keywords that indicate frontend/UI work
FRONTEND_KEYWORDS = [
    'html', 'css', 'javascript', 'js', 'ui', 'interface', 'web page', 'webpage', 
    'website', 'frontend', 'front-end', 'front end', 'design', 'responsive',
    'animation', 'style', 'styling', 'react', 'vue', 'angular', 'dom', 'svg',
    'canvas', 'layout', 'button', 'form', 'input', 'navbar', 'menu', 'modal',
    'component', 'template', 'theme', 'bootstrap', 'tailwind', 'material-ui',
    'landing page', 'portfolio', 'gallery', 'slider', 'carousel', 'grid'
]

# Keywords that indicate backend work
BACKEND_KEYWORDS = [
    'server', 'database', 'api', 'endpoint', 'backend', 'back-end', 'back end',
    'algorithm', 'function', 'class', 'method', 'object', 'data structure',
    'authentication', 'authorization', 'security', 'performance', 'optimization',
    'cache', 'memory', 'storage', 'file', 'io', 'input/output', 'processing',
    'calculation', 'computation', 'logic', 'validation', 'verification', 'testing',
    'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'database', 'query',
    'rest', 'graphql', 'microservice', 'architecture', 'pattern', 'design pattern'
]

# Keywords that indicate data science/ML work
DATA_SCIENCE_KEYWORDS = [
    'data', 'analysis', 'analytics', 'visualization', 'machine learning', 'ml',
    'ai', 'artificial intelligence', 'model', 'training', 'prediction', 'inference',
    'classification', 'regression', 'clustering', 'neural network', 'deep learning',
    'nlp', 'natural language processing', 'computer vision', 'cv', 'statistics',
    'pandas', 'numpy', 'scipy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras',
    'dataset', 'feature', 'label', 'accuracy', 'precision', 'recall', 'f1'
]

# Keywords that indicate creative tasks
CREATIVE_KEYWORDS = [
    'creative', 'beautiful', 'elegant', 'stunning', 'impressive', 'attractive',
    'modern', 'sleek', 'stylish', 'aesthetic', 'visually appealing', 'eye-catching',
    'polished', 'professional', 'sophisticated', 'clean', 'minimalist', 'artistic',
    'colorful', 'vibrant', 'dynamic', 'interactive', 'engaging', 'immersive',
    'innovative', 'unique', 'original', 'novel', 'cutting-edge', 'state-of-the-art',
    'animation', 'transition', 'effect', 'gradient', 'shadow', 'glassmorphism',
    'neumorphism', 'parallax', '3d', 'three-dimensional', 'game', 'portfolio'
]

# Keywords that indicate writing/content tasks
WRITING_KEYWORDS = [
    'write', 'essay', 'article', 'blog', 'story', 'poem', 'letter', 'email',
    'report', 'summary', 'review', 'description', 'explanation', 'tutorial',
    'guide', 'documentation', 'content', 'copy', 'text', 'paragraph',
    'chapter', 'book', 'novel', 'script', 'screenplay', 'dialogue'
]

# Keywords that indicate analysis/research tasks
ANALYSIS_KEYWORDS = [
    'analyze', 'analysis', 'research', 'study', 'examine', 'investigate',
    'compare', 'contrast', 'evaluate', 'assess', 'review', 'critique',
    'pros and cons', 'advantages', 'disadvantages', 'benefits', 'drawbacks',
    'explain', 'describe', 'summarize', 'outline', 'breakdown'
]

# Keywords that indicate question/help tasks
QUESTION_KEYWORDS = [
    'what', 'how', 'why', 'when', 'where', 'who', 'which', 'help',
    'explain', 'tell me', 'show me', 'teach me', 'learn', 'understand',
    'question', 'answer', 'clarify', 'define', 'meaning'
]

def analyze_task(task: str) -> Dict[str, Any]:
    """
    Analyze a user task to determine its characteristics.

    Args:
        task: The user task string

    Returns:
        A dictionary containing analysis results
    """
    task_lower = task.lower()

    # Determine task type scores
    frontend_score = sum(1 for kw in FRONTEND_KEYWORDS if kw in task_lower)
    backend_score = sum(1 for kw in BACKEND_KEYWORDS if kw in task_lower)
    data_science_score = sum(1 for kw in DATA_SCIENCE_KEYWORDS if kw in task_lower)
    writing_score = sum(1 for kw in WRITING_KEYWORDS if kw in task_lower)
    analysis_score = sum(1 for kw in ANALYSIS_KEYWORDS if kw in task_lower)
    question_score = sum(1 for kw in QUESTION_KEYWORDS if kw in task_lower)

    # Determine creativity level needed
    creativity_score = sum(1 for kw in CREATIVE_KEYWORDS if kw in task_lower)

    # Determine if this is a web-related task
    is_web_task = any(kw in task_lower for kw in ['web', 'html', 'css', 'website', 'webpage', 'site'])

    # Determine primary task type
    scores = {
        "frontend": frontend_score,
        "backend": backend_score,
        "data_science": data_science_score,
        "writing": writing_score,
        "analysis": analysis_score,
        "question": question_score
    }

    # Find the highest scoring category
    max_score = max(scores.values())
    if max_score == 0:
        primary_type = "general"
    else:
        primary_type = max(scores, key=scores.get)

    # Calculate recommended temperature based on task type and creativity keywords
    base_temperature = 0.7  # Default creative temperature

    # Adjust based on task type
    if primary_type == "frontend":
        base_temperature = 0.8  # Higher creativity for frontend
    elif primary_type == "backend":
        base_temperature = 0.6  # More focused for backend
    elif primary_type == "data_science":
        base_temperature = 0.5  # More precise for data science
    elif primary_type == "writing":
        base_temperature = 0.8  # Creative for writing
    elif primary_type == "analysis":
        base_temperature = 0.6  # Focused for analysis
    elif primary_type == "question":
        base_temperature = 0.7  # Balanced for questions

    # Adjust based on explicit creativity requests
    if creativity_score >= 3:
        # User explicitly wants creative output
        temperature = min(0.9, base_temperature + 0.2)
    elif creativity_score == 0 and any(kw in task_lower for kw in ['exact', 'precise', 'specific']):
        # User wants precise output
        temperature = max(0.3, base_temperature - 0.3)
    else:
        temperature = base_temperature

    return {
        "primary_type": primary_type,
        "is_web_task": is_web_task,
        "frontend_score": frontend_score,
        "backend_score": backend_score,
        "data_science_score": data_science_score,
        "writing_score": writing_score,
        "analysis_score": analysis_score,
        "question_score": question_score,
        "creativity_score": creativity_score,
        "recommended_temperature": temperature
    }

def get_task_specific_instructions(task: str) -> Tuple[str, float]:
    """
    Get specific instructions and temperature based on task analysis.

    Args:
        task: The user task string

    Returns:
        A tuple containing (additional_instructions, recommended_temperature)
    """
    analysis = analyze_task(task)

    instructions = "Respond exactly as ChatGPT would to this request.\n"

    # Add task-specific instructions
    if analysis["primary_type"] == "frontend":
        instructions += """
For this frontend/UI task:
- Focus on creating a visually stunning and modern design
- Use thoughtful color schemes and typography
- Add subtle animations and transitions where appropriate
- Ensure the UI is responsive and works on all device sizes
- Pay attention to spacing, alignment, and visual hierarchy
- Include modern CSS features like flexbox, grid, or CSS variables
- Consider accessibility (ARIA attributes, semantic HTML, etc.)
"""
    elif analysis["primary_type"] == "backend":
        instructions += """
For this backend/logic task:
- Create elegant, efficient algorithms and data structures
- Implement robust error handling and validation
- Design a clean, intuitive API or interface
- Focus on performance optimization where appropriate
- Use modern language features and best practices
- Structure the code for maintainability and extensibility
"""
    elif analysis["primary_type"] == "data_science":
        instructions += """
For this data science/ML task:
- Implement efficient, accurate algorithms
- Include clear data preprocessing and validation steps
- Add visualizations or reporting capabilities where appropriate
- Focus on model interpretability and explainability
- Include performance metrics and evaluation methods
- Structure the code for reproducibility and experimentation
"""
    elif analysis["primary_type"] == "writing":
        instructions += """
For this writing/content task:
- Create engaging, well-structured content
- Use appropriate tone and style for the context
- Ensure clarity, readability, and proper flow
- Include relevant examples or details where helpful
- Structure the content with clear organization
- Maintain consistency in voice and perspective
"""
    elif analysis["primary_type"] == "analysis":
        instructions += """
For this analysis/research task:
- Provide thorough, logical analysis with clear reasoning
- Support points with evidence or examples
- Present information in a well-organized manner
- Consider multiple perspectives where appropriate
- Draw clear conclusions based on the analysis
- Use structured formatting to enhance readability
"""
    elif analysis["primary_type"] == "question":
        instructions += """
For this question/explanation task:
- Provide comprehensive, accurate answers
- Use clear, accessible language
- Include examples and analogies when helpful
- Structure information from basic to advanced concepts
- Address the question directly and thoroughly
- Anticipate follow-up questions and provide context
"""
    else:
        instructions += """
For this general task:
- Provide a helpful, comprehensive response
- Use appropriate formatting and structure
- Be clear, accurate, and informative
- Adapt your response style to match the request
- Include relevant examples or context as needed
"""

    # Add web-specific instructions if applicable
    if analysis["is_web_task"]:
        instructions += """
Since this is a web development task:
- Use modern web standards and best practices
- Create a responsive design that works on mobile and desktop
- Include appropriate meta tags and SEO considerations
- Consider page load performance and optimization
- Add appropriate error states and loading indicators
"""

    return instructions, analysis["recommended_temperature"]
