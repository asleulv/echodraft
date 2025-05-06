# AI Generation Testing Tools

This directory contains several scripts to help diagnose and troubleshoot issues with the OpenAI API integration for document generation. These tools will help you identify the optimal settings for your AI document generation feature.

## Prerequisites

Before running these scripts, make sure you have:

1. Python 3.6+ installed
2. The OpenAI Python package installed (`pip install openai`)
3. Your OpenAI API key

## Available Test Scripts

### 1. Basic API Test (`test_openai_api.py`)

This script tests the OpenAI API with the same parameters used in your application. It helps determine if the issue is with the API itself or with your application's integration.

**Usage:**
```bash
python test_openai_api.py --api_key YOUR_API_KEY [--model MODEL_NAME] [--temperature TEMP] [--max_tokens MAX_TOKENS]
```

**Example:**
```bash
python test_openai_api.py --api_key sk-abcd1234 --temperature 0.9 --max_tokens 3000
```

### 2. Model Version Test (`test_model_versions.py`)

This script tests different OpenAI model versions to see which one produces the best results. It helps determine if the issue is related to the specific model being used.

**Usage:**
```bash
python test_model_versions.py --api_key YOUR_API_KEY [--temperature TEMP] [--max_tokens MAX_TOKENS]
```

**Example:**
```bash
python test_model_versions.py --api_key sk-abcd1234 --temperature 0.9
```

### 3. Temperature Settings Test (`test_temperature_settings.py`)

This script tests different temperature settings to see which one produces the best results. It helps determine if the issue is related to the temperature parameter.

**Usage:**
```bash
python test_temperature_settings.py --api_key YOUR_API_KEY [--model MODEL_NAME] [--max_tokens MAX_TOKENS]
```

**Example:**
```bash
python test_temperature_settings.py --api_key sk-abcd1234 --model gpt-3.5-turbo-0125
```

## Interpreting Results

Each script will:

1. Save the generated content to HTML files for easy comparison
2. Print information about the API response, including token usage and generation time
3. Provide a summary of results at the end

When comparing results, look for:

- **Content Length**: Is the content reaching the requested length (750-1500 words)?
- **Language Consistency**: Is the content in the correct language/dialect (Norwegian nynorsk)?
- **Style Matching**: Does the content match the style, tone, and voice of the example?
- **HTML Formatting**: Is the content properly formatted with HTML tags?

## Recommended Approach

1. Start with the basic API test to see if you can reproduce the issue
2. If the basic test shows issues, try different model versions to see if a different model works better
3. If model changes don't help, try different temperature settings to find the optimal value
4. After identifying the best settings, update your application's code accordingly

## Applying Findings to Your Application

Once you've identified the optimal settings, update the `ai_views.py` file with:

1. The best-performing model version
2. The optimal temperature setting
3. Any necessary changes to the system message or prompt template

Remember to test the changes in your application to ensure they resolve the issue.
