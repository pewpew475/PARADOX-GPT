# 🧠 ParadoxGPT

<div align="center">

![ParadoxGPT Logo](https://img.shields.io/badge/ParadoxGPT-Advanced%20AI%20Assistant-ff6b35?style=for-the-badge&logo=brain&logoColor=white)

**A distributed multi-agent AI system powered by Gemini-2.0-Flash that delivers refined, creative, and aesthetically pleasing solutions for any task.**

[![Python](https://img.shields.io/badge/Python-3.8+-blue?style=flat-square&logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green?style=flat-square&logo=flask)](https://flask.palletsprojects.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.0--Flash-orange?style=flat-square&logo=google)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Configuration](#-configuration) • [Contributing](#-contributing)

</div>

---

## 🌟 Features

### 🎯 **Universal Intelligence**
- **Multi-Domain Expertise**: Handles coding, writing, analysis, creative tasks, research, and problem-solving
- **Enhanced Creativity**: Delivers solutions with superior aesthetic appeal and creative enhancements
- **Holistic Thinking**: Considers technical, creative, practical, and contextual aspects

### 🏗️ **Advanced Architecture**
- **Distributed Multi-Agent System**: 14 specialized AI agents working in harmony
- **Task Decomposition**: Intelligent breakdown of complex requests into manageable subtasks
- **Hierarchical Processing**: Task Divider → 10 Thinkers → 2 Mid-Level Combiners → Final Combiner

### 🎨 **Superior Output Quality**
- **Aesthetic Focus**: Prioritizes visual appeal and user experience
- **Clean Code Generation**: Production-ready code with modern best practices
- **Creative Enhancement**: Goes beyond basic requirements to deliver exceptional results
- **Comprehensive Solutions**: Complete, working implementations with proper documentation

### 💻 **Modern Interface**
- **Claude-Inspired Design**: Clean, minimalist interface with excellent UX
- **Responsive Layout**: Works seamlessly across all devices
- **Real-Time Processing**: Live updates and smooth interactions
- **Dark Theme**: Professional, eye-friendly design

---

## 🚀 Installation

### Prerequisites
- Python 3.8 or higher
- 14 Google Gemini-2.0-Flash API keys
- Modern web browser

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/paradoxgpt.git
   cd paradoxgpt
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure API keys**
   ```bash
   cp .env.example .env
   # Edit .env with your 14 Gemini API keys
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Open your browser**
   ```
   http://localhost:8000
   ```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with your API keys:

```env
# Task Divider API Key
DIVIDER_API_KEY=your_divider_api_key_here

# Thinker API Keys (10 separate keys)
THINKER_1_API_KEY=your_thinker_1_api_key_here
THINKER_2_API_KEY=your_thinker_2_api_key_here
# ... continue for all 10 thinkers

# Mid-Level Combiner API Keys (2 separate keys)
MID_COMBINER_1_API_KEY=your_mid_combiner_1_api_key_here
MID_COMBINER_2_API_KEY=your_mid_combiner_2_api_key_here

# Final Combiner API Key
FINAL_COMBINER_API_KEY=your_final_combiner_api_key_here
```

### Getting Gemini API Keys

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create 14 separate API keys for optimal performance
3. Add them to your `.env` file as shown above

---

## 🎯 Usage

### Basic Usage

1. **Start a conversation**: Type your request in the input field
2. **Any topic welcome**: Ask about coding, writing, analysis, creative work, or any other topic
3. **Get enhanced results**: Receive refined, creative, and aesthetically pleasing responses
4. **Iterate and refine**: Continue the conversation to build upon previous responses

### Example Requests

```
🔹 "Create a responsive portfolio website with modern design"
🔹 "Write a compelling blog post about sustainable technology"
🔹 "Analyze the pros and cons of remote work culture"
🔹 "Design a creative marketing campaign for a new product"
🔹 "Explain quantum computing in simple terms with examples"
```

### Advanced Features

- **HTML Preview**: Automatically preview generated HTML/CSS code
- **Code Highlighting**: Syntax highlighting for all programming languages
- **Markdown Support**: Rich text formatting in responses
- **Conversation History**: Track and revisit previous conversations

---

## 🏗️ Architecture

### Multi-Agent System

```
User Request
     ↓
Task Divider (1 agent)
     ↓
10 Parallel Thinkers
     ↓
2 Mid-Level Combiners
     ↓
Final Combiner
     ↓
Refined Response
```

### Agent Roles

- **Task Divider**: Breaks complex requests into 10 manageable subtasks
- **Thinkers**: Process individual subtasks with specialized focus
- **Mid-Level Combiners**: Merge related responses into coherent sections
- **Final Combiner**: Creates the polished, final response

---

## 🛠️ Development

### Project Structure

```
paradoxgpt/
├── app.py                 # Flask application entry point
├── orchestrator.py        # Multi-agent orchestration logic
├── api_client.py         # Gemini API client
├── config.py             # Configuration management
├── prompts.py            # AI prompts and instructions
├── static/               # CSS, JS, and assets
│   ├── css/style.css     # Main stylesheet
│   └── js/main.js        # Frontend JavaScript
├── templates/            # HTML templates
│   └── index.html        # Main interface
├── requirements.txt      # Python dependencies
├── .env                  # Environment variables (not in repo)
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini Team** for the powerful Gemini-2.0-Flash API
- **Flask Community** for the excellent web framework
- **Claude AI** for interface design inspiration
- **Open Source Community** for continuous innovation

---

<div align="center">

**Made with ❤️ by the ParadoxGPT Team**

[Report Bug](https://github.com/yourusername/paradoxgpt/issues) • [Request Feature](https://github.com/yourusername/paradoxgpt/issues) • [Documentation](https://github.com/yourusername/paradoxgpt/wiki)

</div>
