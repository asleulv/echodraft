# Management Commands

This directory contains custom Django management commands for the application.

## create_demo_docs

**Purpose:** Creates missing demo documents for organizations that don't have a complete set of example content.

**Usage:**
python manage.py create_demo_docs


**What it does:**
- Processes all organizations in the system
- For each organization, checks which demo document types are missing
- Creates only the missing demo documents (avoids duplicates)
- Creates a "🎯 Demo" category if it doesn't exist
- Uses the first available superuser as the document creator

**Demo Documents Created:**
1. **LinkedIn Post About Productivity** (`linkedin_productivity`) - Professional productivity content
2. **News Article About New City Park** (`news_city_park`) - Journalistic style article
3. **Fairy Tale About Lila the Baker** (`fairy_tale_baker`) - Creative storytelling
4. **Facebook Rant About Streaming Services** (`facebook_streaming_rant`) - Casual social media style with emojis
5. **Satirical Humor Text About Toast** (`satirical_toast`) - Witty, sarcastic commentary

**Requirements:**
- At least one superuser must exist in the system
- Organizations must exist to receive demo documents

**Key Features:**
- **Safe to run multiple times** - Only creates missing documents, never duplicates
- **Identifies documents by `demo_type`** - Uses stable identifiers instead of titles
- **Preserves existing demo category settings** - Won't overwrite customized category properties
- **Detailed output** - Shows which organizations were processed and how many documents were created

**Example Output:**
Loading development settings...
ℹ️ Created 0 missing demo documents for organization: ExistingOrg
✅ Created 3 missing demo documents for organization: NewOrg
✅ Created 5 missing demo documents for organization: EmptyOrg
Successfully processed 3 organizations, updated 2 of them!


**Error Handling:**
- Exits gracefully if no superuser exists
- Provides clear error message with instructions to create a superuser

**Related Files:**
- `documents/utils/demo_content.py` - Contains the actual demo document creation logic
- Uses `TextDocument` model and `Category` model

