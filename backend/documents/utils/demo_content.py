def create_demo_documents_for_new_org(organization, creator_user):
    """Create demo documents and demo category when a new organization signs up"""
    from ..models import TextDocument
    from categories.models import Category
    
    # First, create a Demo category
    demo_category, created = Category.objects.get_or_create(
        name="🎯 Demo",
        organization=organization,
        defaults={
            'description': 'Example documents showcasing different writing styles and EchoDraft capabilities',
            'color': '#FF6B35',
            'icon': '🎯',
        }
    )
    
    demo_documents = [
        {
            'title': 'LinkedIn Post About Productivity',
            'demo_type': 'linkedin_productivity',  # ✅ Stable identifier
            'content': '''<p>In today's fast-moving world, productivity isn't about doing <em>more</em>, it's about focusing on doing the <em>right things</em>. Too many of us mix up <em>being busy for being effective</em>. The key is building systems that reduce decision fatigue. For me that means blocking mornings for deep work and pushing meetings to afternoons. It's simple, but the difference is huge.</p>
            <p>Here's a challenge... tomorrow, write down your <em>top three priorities</em> before checking email. Then reflect on how you feel at the end of the work day. Chances are you'll find yourself calmer and clearer about what truly matters. You might learn a lot!</p>
            <p>Productivity hacks are everywhere, but lasting success comes from small and consistent habits. Focus, clarity, and discipline aren't buzzwords, they're the foundation of progress. What's your go-to habit for staying on track? Do you use an app or a reminder tool?</p>''',
            'status': 'published',
            'tags': ['demo', 'linkedin', 'productivity', 'professional', 'habits'],
            'category': demo_category,
        },
        {
            'title': 'News Article About New City Park',
            'demo_type': 'news_city_park',  # ✅ Stable identifier
            'content': '''<p>City officials announced today the opening of a new park in the downtown district, featuring interactive art installations and a community garden. The project, which has been in development for three years, aims to bring more green space to urban residents.</p>
            <p>At the ribbon-cutting ceremony, Mayor Anika Sharma highlighted the park as "a symbol of what collaboration between citizens and local government can achieve." Funding for the project came from a mix of municipal bonds and private donations.</p>
            <p>Local residents expressed excitement. "It's nice to have a place to relax that's close to home," said Amir Khan, a teacher who lives nearby. Environmental groups praised the garden's emphasis on native plants and sustainability practices.</p>
            <p>The park will be open daily from sunrise to sunset, with future events including weekend markets and outdoor concerts.</p>''',
            'status': 'published',
            'tags': ['demo', 'news', 'community', 'park', 'local-government'],
            'category': demo_category,
        },
        {
            'title': 'Fairy Tale About Lila the Baker',
            'demo_type': 'fairy_tale_baker',  # ✅ Stable identifier
            'content': '''<p>Once upon a time in a quiet village in a deep forest, there lived a baker named Lila. Every morning, she got up early and kneaded dough while the rest of the town slept. Her bread was so soft and golden that the villagers believed it was magical.</p>
            <p>But one winter, a great frost swept across the land. The ovens froze, and no bread could rise. Hungry and worried, the villagers turned to Lila. She remembered an old story her grandmother had told her: "Warm the heart, and the hearth will follow".</p>
            <p>So Lila invited everyone into her bakery. They sang songs, shared stories, and kindled a fire together. Slowly, the warmth returned, and the dough began to rise again. The bread was richer than ever because it was baked with more than flour and water; it was baked with hope.</p>
            <p>And so the village was taught a lesson... that true magic is not in recipes but in community and togetherness.</p>''',
            'status': 'published',
            'tags': ['demo', 'fairy-tale', 'storytelling', 'community', 'magical'],
            'category': demo_category,
        },
        {
            'title': 'Facebook Rant About Streaming Services',
            'demo_type': 'facebook_streaming_rant',  # ✅ Stable identifier
            'content': '''<p>Okay but can we PLEASE talk about how I need like 47 different streaming services just to watch my shows? 📺💸 #StreamingStruggles #ModernProblems</p>
            <p>Netflix has Stranger Things but then cancels everything else after one season 🙄 Disney+ has Marvel but costs extra for the good stuff 🦸‍♀️💰 HBO Max (sorry, "Max" 🤡) has the prestige dramas but changes its name every five minutes #ConfusionMaximized</p>
            <p>And don't even get me STARTED on Peacock having The Office 😤 Like sir, that used to be FREE on Netflix and now you want me to pay $12.99/month to watch Jim prank Dwight? The audacity! 🏢📋 #TheOffice #StreamingScam</p>
            <p>Apple TV+ exists apparently? 🍎📱 Amazon Prime Video hides everything behind additional rentals 🙃 Paramount+ keeps sending me emails like "Remember we exist!" 📧😅 Hulu still has ads on the paid tier because OF COURSE IT DOES 📺😡</p>
            <p>Me trying to remember which platform has which show: 🤯🔄 Also me: *pirates everything anyway* 🏴‍☠️ (JK Netflix lawyers, I would never 👀💅) #StreamingLife #DigitalNomad #BrokeMillennial</p>
            <p>The worst part? They rotate content so by the time you remember you wanted to watch something, it's GONE 👻 "Oh you wanted to finish that series? Too bad, we sent it to Tubi" 📺💔 #StreamingAmnesia #FOMO</p>
            <p>Anyway, time to spend 45 minutes scrolling through all my apps to find something to watch 📱⏰ Will probably end up rewatching The Office on Peacock because I'm predictable like that 🤷‍♀️ #StreamingParalysis #BasicMillennial</p>''',
            'status': 'published',
            'tags': ['demo', 'social-media', 'streaming', 'millennial', 'hashtag-heavy'],
            'category': demo_category,
        },
        {
            'title': 'Satirical Humor Text About Toast',
            'demo_type': 'satirical_toast',  # ✅ Stable identifier
            'content': '''<p>Toast. The culinary equivalent of a participation trophy. A slice of bread that went to charm school and came back crunchy, smug, and somehow overpriced. People act like it's the pinnacle of human achievement (butter! jam! avocado!) as if we've discovered a way to turn cardboard into art. Spoiler alert: we haven't.</p>
            <p>Cafés now serve "artisanal toast" on wooden planks like it's the Mona Lisa of breakfast. They call it rustic. I call it financial terrorism. And sourdough? Right... sourdough. The bread that's aged like a fine wine but chews like a medieval boot. Seemingly, the older it is, the more "character" it has. Meanwhile, I'm getting grumpy... and even more hungry.</p>
            <p>Here's a revolutionary thought: breakfast doesn't need an Instagram account. Blueberries in perfect triangles? Optional. Pancakes stacked like the Leaning Tower of Pisa? Unnecessary. Sometimes cereal in pajamas is all the philosophy you need.</p>
            <p>Toast isn't a lifestyle. It's a minor sunburn for bread. Stop pretending it's enlightenment.</p>''',
            'status': 'published',
            'tags': ['demo', 'satire', 'humor', 'food', 'sarcastic'],
            'category': demo_category,
        },
    ]
    
    for demo_data in demo_documents:
        TextDocument.objects.create(
            organization=organization,
            created_by=creator_user,
            is_demo=True,
            **demo_data
        )
    
    return f"Created {len(demo_documents)} demo documents and demo category for organization: {organization.name}"
