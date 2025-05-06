from django.db import migrations
from django.utils import timezone

def create_initial_legal_documents(apps, schema_editor):
    LegalDocument = apps.get_model('legal', 'LegalDocument')
    
    # Create Terms of Service
    terms = LegalDocument(
        type='terms',
        title='Terms of Service',
        content='''
<h1>Terms of Service</h1>

<h2>1. Introduction</h2>
<p>Welcome to echodraft. These Terms of Service govern your use of our website and services.</p>

<h2>2. Acceptance of Terms</h2>
<p>By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>

<h2>3. Description of Service</h2>
<p>echodraft provides a platform for creating, storing, and managing text documents. Our service includes AI-powered document generation and formatting tools.</p>

<h2>4. User Accounts</h2>
<p>When you create an account with us, you must provide accurate and complete information. You are responsible for safeguarding the password and for all activities that occur under your account.</p>

<h2>5. Content Ownership</h2>
<p>You retain all rights to your content. By uploading content to echodraft, you grant us a license to host, store, and display your content solely for the purpose of providing our services to you.</p>

<h2>6. Prohibited Uses</h2>
<p>You may not use our service for any illegal or unauthorized purpose. You must not violate any laws in your jurisdiction.</p>

<h2>7. Termination</h2>
<p>We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

<h2>8. Limitation of Liability</h2>
<p>In no event shall echodraft, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>

<h2>9. Changes to Terms</h2>
<p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.</p>

<h2>10. Contact Us</h2>
<p>If you have any questions about these Terms, please contact us.</p>
''',
        version=1,
        effective_date=timezone.now().date()
    )
    terms.save()
    
    # Create Privacy Policy
    privacy = LegalDocument(
        type='privacy',
        title='Privacy Policy',
        content='''
<h1>Privacy Policy</h1>

<h2>1. Introduction</h2>
<p>Your privacy is important to us. It is echodraft's policy to respect your privacy regarding any information we may collect from you across our website and other sites we own and operate.</p>

<h2>2. Information We Collect</h2>
<p>We only collect information about you if we have a reason to do so—for example, to provide our services, to communicate with you, or to make our services better. We collect information in the following ways:</p>

<h3>2.1 Information You Provide to Us</h3>
<p>We collect information that you provide to us directly, including:</p>
<ul>
  <li>Account information: We collect information when you register for an account, such as your name, email address, and password.</li>
  <li>Content information: We collect the content you create, upload, or share on our platform.</li>
  <li>Communications: If you contact us, we may keep a record of that communication.</li>
</ul>

<h3>2.2 Information We Collect Automatically</h3>
<p>We automatically collect some information about your visit to our website, such as:</p>
<ul>
  <li>Log information: We collect information that web browsers, mobile devices, and servers typically make available, such as the browser type, IP address, unique device identifiers, language preference, referring site, the date and time of access, operating system, and mobile network information.</li>
  <li>Usage information: We collect information about your usage of our services, such as the pages you visit, the links you click, and the time spent on our site.</li>
  <li>Location information: We may determine the approximate location of your device from your IP address.</li>
</ul>

<h2>3. How We Use Information</h2>
<p>We use the information we collect in various ways, including to:</p>
<ul>
  <li>Provide, operate, and maintain our services</li>
  <li>Improve, personalize, and expand our services</li>
  <li>Understand and analyze how you use our services</li>
  <li>Develop new products, services, features, and functionality</li>
  <li>Communicate with you, either directly or through one of our partners, for customer service, to provide you with updates and other information relating to the service, and for marketing and promotional purposes</li>
  <li>Process your transactions</li>
  <li>Find and prevent fraud</li>
</ul>

<h2>4. Sharing Information</h2>
<p>We do not share your personal information with third parties without your consent, except:</p>
<ul>
  <li>With third-party vendors and service providers who need access to your information to help us provide our services</li>
  <li>To comply with legal obligations</li>
  <li>To protect the rights, property, or safety of echodraft, our users, or others</li>
</ul>

<h2>5. Security</h2>
<p>We take reasonable precautions to protect your information. However, no method of transmission over the internet, or method of electronic storage is 100% secure.</p>

<h2>6. Your Rights</h2>
<p>You have the right to access, correct, delete, or export your personal information. You can also object to or restrict the processing of your personal information.</p>

<h2>7. Changes to This Privacy Policy</h2>
<p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

<h2>8. Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us.</p>
''',
        version=1,
        effective_date=timezone.now().date()
    )
    privacy.save()

def delete_legal_documents(apps, schema_editor):
    LegalDocument = apps.get_model('legal', 'LegalDocument')
    LegalDocument.objects.filter(type='terms').delete()
    LegalDocument.objects.filter(type='privacy').delete()

class Migration(migrations.Migration):

    dependencies = [
        ('legal', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_initial_legal_documents, delete_legal_documents),
    ]
