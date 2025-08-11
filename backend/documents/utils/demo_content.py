def create_demo_documents_for_new_org(organization, creator_user):
    """Create demo documents and demo category when a new organization signs up"""
    from ..models import TextDocument  # Import here to avoid circular imports
    from categories.models import Category  # Add this import
    
    # First, create a Demo category using the correct fields
    demo_category, created = Category.objects.get_or_create(
        name="🎯 Demo",
        organization=organization,
        defaults={
            'description': 'Example documents showcasing different writing styles and EchoDraft capabilities',
            'color': '#FF6B35',  # Orange color to make it stand out
            'icon': '🎯',  # Target emoji as icon
        }
    )
    
    demo_documents = [
        {
            'title': 'Dr. Seuss-Style Children\'s Rhyme',
            'content': '''<p>Oh my stars! Oh my glee!<br>
            What a sight there is to see!<br>
            In my room, upon my bed,<br>
            Sits a creature, blue and red!</p>
            <p>"Who are you?" I said with fright.<br>
            "What brings you here in the night?"<br>
            The creature grinned from ear to ear,<br>
            "I'm the Giggle-Wiggle-Wheer!"</p>
            <p>"I bounce and hop and flip and flop,<br>
            I never, ever, ever stop!<br>
            I came to play, I came to dance,<br>
            I came to prance and skip and prance!"</p>
            <p>We played until the morning light,<br>
            What a wild and wacky night!<br>
            But when the sun began to rise,<br>
            The Giggle-Wiggle said goodbye.</p>
            <p>Now when I'm tucked into my bed,<br>
            I dream of creatures, blue and red,<br>
            And hope that when the night is near,<br>
            I'll see my Giggle-Wiggle-Wheer!</p>''',
            'status': 'published',
            'tags': ['demo', 'children', 'rhyme', 'seuss-style', 'creative'],
            'category': demo_category,
        },
        {
            'title': 'Pretentious Art Criticism',
            'content': '''<p>The ontological trajectory of Modernist discourse, as articulated through the phenomenological apparatus of contemporary neo-conceptualist frameworks, necessitates a rigorous deconstruction of the hegemonic narratives that have traditionally circumscribed our understanding of aesthetic praxis within the post-industrial paradigm.</p>
            <p>This particular installation—if indeed we can deploy such a reductive terminology without falling prey to the essentialist trap—operates as a liminal space wherein the dialectical tension between signifier and signified becomes palpably manifest. The artist's deliberate subversion of categorical imperatives reveals an acute cognizance of the interstitial dynamics that govern the commodification of cultural production in late-stage capitalism.</p>
            <p>One cannot help but observe the profound epistemological rupture that emerges from the juxtaposition of organic materiality against the sterile geometry of institutional architecture. This dialogical relationship—simultaneously symbiotic and adversarial—speaks to the fundamental ambivalence that characterizes our contemporary moment: caught between the nostalgic yearning for authentic experience and the inexorable logic of technological mediation.</p>
            <p>The work thus functions as both symptom and critique, a paradoxical gesture that implicates the viewer in the very structures of power it purports to interrogate. Through this metacritical maneuver, the artist achieves a kind of epistemic vertigo, destabilizing our conventional frameworks of interpretation while simultaneously reinforcing their centrality to meaning-making processes.</p>''',
            'status': 'published',
            'tags': ['demo', 'art-criticism', 'pretentious', 'academic', 'verbose'],
            'category': demo_category,
        },
        {
            'title': 'Hipster Urban Food Blog',
            'content': '''<p>Look, I'm not gonna lie – I used to roll my eyes at the whole organic thing. Another overpriced trend for people with too much disposable income, right? But then I moved to this neighborhood where the bodega guy, Carlos, started stocking these incredible heirloom tomatoes from some farm upstate, and honestly? Game changer.</p>
            <p>The thing about eating organic in the city isn't about being precious or performative. It's about finding those hidden gems that haven't been discovered by the food blog industrial complex yet. Like this little co-op tucked behind the laundromat on 47th – they get deliveries from farms I'd never heard of, stuff that makes Whole Foods look like a tourist trap.</p>
            <p>I've been experimenting with this sourdough starter (yes, I'm that person now) using organic flour from a mill in the Hudson Valley. The bread tastes like actual bread, not the spongy nonsense you get at chain stores. My neighbor, who's been baking for thirty years, tried a slice and was like, "Where did you get this flour?" That's when you know you've found something real.</p>
            <p>The farmers market on Saturday mornings has become my weekly ritual. Not the crowded one in Union Square – that's for amateurs. There's this smaller one in Prospect Heights where the vendors actually remember your name and will slip you the good stuff before it hits the stands. Maria, who grows the most insane rainbow chard, always saves me a bunch because she knows I actually cook with it instead of just posting it on Instagram.</p>
            <p>Here's the thing: eating organic in the city isn't about following trends or flexing your grocery budget. It's about building relationships with people who give a damn about what they're growing. It's about tasting food that hasn't been engineered to survive three weeks in a warehouse. Once you experience that difference, there's really no going back to the plastic-wrapped, shipped-from-nowhere stuff.</p>''',
            'status': 'published',
            'tags': ['demo', 'food-blog', 'hipster', 'urban', 'organic'],
            'category': demo_category,
        },
        {
            'title': 'British Black Humor Commentary',
            'content': '''<p>Well, isn't this lovely? We've spent the last decade teaching machines to think, and they've responded by becoming better at our jobs than we are. Brilliant strategy, humanity. Really top-notch forward planning.</p>
            <p>They say artificial intelligence will revolutionize everything – healthcare, transport, education. Marvelous. I can hardly wait for my GP to be replaced by a chatbot that diagnoses my existential dread as a vitamin deficiency and prescribes me a nice cup of tea. At least it'll be more accurate than Dr. Henderson, who once told me my chronic fatigue was "probably just being British."</p>
            <p>The optimists insist AI will create new jobs we haven't even imagined yet. How reassuring. I'm sure there's a thriving career in "human authenticity verification" or "emotional labor consultant" waiting for us all. Nothing quite like being paid to prove you're not a robot to a robot that's pretending to care about your feelings.</p>
            <p>Meanwhile, we're training these systems on everything we've ever written, said, or searched for at 3 AM. Essentially, we've created super-intelligent beings with access to humanity's complete browser history. If they don't immediately decide to end us out of sheer embarrassment, they're more forgiving than we deserve.</p>
            <p>Still, there's something beautifully poetic about it all. We've managed to create minds more logical than ours, more efficient than ours, and probably more emotionally stable than ours. The only thing left for us humans is what we've always done best: stand around making sarcastic comments about how everything's gone to hell. At least it's steady work.</p>''',
            'status': 'published',
            'tags': ['demo', 'british-humor', 'black-humor', 'ai-commentary', 'satirical'],
            'category': demo_category,
        },
        {
            'title': 'Social Media Streaming Rant',
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
            'title': 'Music Review: Ghost - Skeletá',
            'content': '''<p>You can hear it whispering in the wind, and you feel it right down to your bones – a storm is brewing. The hammer is about to fall again. God help us.</p>
            <p>Well… only in make-believe, of course. Because Ghost is still very much a theatre production where Tobias Forge writes the script, directs the play, and takes the leading role. With every act, his dedication to the fans seems to grow, even as the critics keep wrinkling their noses. Maybe it's the contrast between the dark exterior and the ever-softer core that makes purists choke on it.</p>
            <p>There's not much left of the mysterious, raw, 70s-tinged Ghost that debuted with Opus Eponymous fifteen years ago, playing doom-laced tunes under the sun-warmed festival tent at Øya. Skeletá is far from underground – this is pure stadium rock, now with even more AOR and 80s heavy metal as clear inspirations.</p>
            <p>The typical Ghost song in 2025 still paints scenes of darkness, self-reflection, and power – standing before a higher authority, a leader of some kind – often the Devil himself. Musically, there's a resemblance to what Desmond Child did to make Alice Cooper huge in the early 90s.</p>
            <p>Forge sings, "In the middle of the night, it feeds / In the middle of the night, it eats you," before declaring he's done shedding tears over someone like you. Musically, it's synth-driven and easy to digest – far removed from the mysterious, Blue Öyster Cult-like Ghost that emerged fifteen years ago.</p>
            <p>And that's perfectly fine. Because even though the early sound had its unique mystique, there's ironically more substance in this increasingly polished version of the beast. In 2025, Ghost aren't just big – they're among the biggest of their generation. And dare I say… the best.</p>''',
            'status': 'published',
            'tags': ['demo', 'music-review', 'analytical', 'metal', 'english'],
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
