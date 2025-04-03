import sys
import openai
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/analyze": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["POST"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize OpenAI (replace with your actual API key)
openai.api_key = "your-openai-api-key"

def analyze_code(code, language):
    """
    Enhanced code analysis with AI suggestions
    Returns: {
        "errors": list of errors,
        "suggestions": list of improvements,
        "corrected_code": fixed code (if applicable),
        "ai_analysis": detailed AI explanation
    }
    """
    response = {
        "errors": [],
        "suggestions": [],
        "corrected_code": None,
        "ai_analysis": None
    }

    # Basic static analysis
    if language == "python":
        if "for i in range(10):" in code and ":" not in code:
            response["errors"].append("Missing colon in for loop")
            response["suggestions"].append("Add colon: `for i in range(10):`")
            response["corrected_code"] = code.replace("for i in range(10)", "for i in range(10):")
        
        if "==" in code and "=" in code:
            response["errors"].append("Possible assignment instead of comparison")
            response["suggestions"].append("Use `==` for comparison instead of `=`")

    # AI-powered analysis
    try:
        ai_response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system", 
                    "content": f"You are a {language} code debugging assistant. Provide:"
                              "\n1. Specific errors found"
                              "\n2. Clear suggestions"
                              "\n3. Corrected code (if needed)"
                              "\n4. Explanation of changes"
                },
                {
                    "role": "user", 
                    "content": f"Analyze this {language} code:\n```{language}\n{code}\n```"
                }
            ],
            temperature=0.3
        )
        
        ai_content = ai_response.choices[0].message.content
        response["ai_analysis"] = ai_content
        
    except Exception as e:
        response["ai_error"] = str(e)
        app.logger.error(f"AI Analysis Error: {str(e)}")

    return response

@app.route('/test')
def test():
    """Test endpoint to verify backend is running"""
    app.logger.info("Test endpoint accessed")
    return jsonify({
        "status": "success",
        "message": "Backend is working",
        "endpoints": {
            "analyze": "POST /analyze",
            "test": "GET /test"
        }
    })

@app.route('/analyze', methods=['POST'])
def api_analyze():
    """Main analysis endpoint"""
    app.logger.info("\n=== New Analysis Request ===")
    
    try:
        # Log request details
        app.logger.info(f"Headers: {request.headers}")
        app.logger.info(f"Received data: {request.json}")
        
        data = request.json
        if not data:
            app.logger.warning("No JSON data received")
            return jsonify({"error": "Request body must be JSON"}), 400
            
        code = data.get('code', '').strip()
        language = data.get('language', 'python').lower()
        
        if not code:
            app.logger.warning("Empty code received")
            return jsonify({"error": "No code provided"}), 400
        
        # Perform analysis
        analysis = analyze_code(code, language)
        app.logger.info(f"Analysis completed for {language} code")
        app.logger.info(f"Results: {analysis}")
        
        return jsonify(analysis)
        
    except Exception as e:
        app.logger.error(f"API Error: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)