#!/usr/bin/env python3
"""build.py — Study 15, the doors. Writes studies/15/doors.json.

Every door below was chosen by reading the poem: the line that most holds the word.
Two vocabularies, each fully assigned: `senses` (light, weather, texture, temperature,
sound) and `feelings` (states and moments). Photos are assigned by hand from their
alt text, caption and scoring notes (v2/scores-photos.json).

The only mechanical step: a phrase typed with a straight apostrophe where the poem
has a curly one (or the reverse) is matched to the poem's own characters, so the
written phrase is always a verbatim substring. Anything else that does not match fails.

Run: python3 studies/15/build.py      then: node studies/15/check.mjs
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).with_name("doors.json")

WORDS = {
    "senses": ["first light", "soft light", "low sun", "full sun", "the dark", "shimmer", "grey",
               "mist", "rain", "dew", "wind", "cold", "warm", "the sea", "the river", "stone",
               "sand", "bark", "green", "red", "orange", "in bloom", "silence", "birdsong",
               "the beat", "breath", "skin", "heavy", "smell"],
    "feelings": ["leaving", "the wait", "home", "alone", "goodbye", "the empty space", "awe",
                 "falling in love", "held close", "dancing", "missing you", "memory", "tomorrow",
                 "grow tall", "the fall", "hiding", "laughter", "fear", "free", "the long road",
                 "prayer", "play"],
}

# slug: (senses doors, feelings doors); a door is "phrase | word"
POEMS = {
"a-conversation-among-birds": (
    ["Hark, here comes the dawn | first light", "that quiet scythe | silence", "a conversation among birds | birdsong"],
    ["Are you satisfied this morning | the wait", "that quiet scythe will slay this rural landscape | fear"]),
"a-wedding-toast": (
    ["that held me close | warm", "Where that godforsaken heavy doubt used to be. | heavy"],
    ["When I left a place | leaving", "With maybe a little more space for awe | awe", "To you, my friends, all the love in the world. | held close"]),
"an-ode-to-aspens": (
    ["They’ve always been silent soldiers | silence", "Let my matter become their matter | bark"],
    ["It’s been hard watching them fall | the fall", "I wish to spent eternity in their embrace | held close", "In the end | goodbye"]),
"and-now-that-we-walk": (
    ["Let the sun shine on our path | full sun", "Here you come, here you come, here you come. | the beat"],
    ["Heads held high | free", "Be proud, child, for I am proud of you. | held close"]),
"anuraag-oh-anuraag": (
    ["The river which continues | the river", "Thrashing about | the beat"],
    ["And wait in discontent | the wait", "Tell me where will you go? | leaving", "You are caught and snared | held close"]),
"ariel": (
    ["like if only I could spin fast enough | wind", "made me pick you up | skin"],
    ["I hope you know when we fell | the fall", "and spin you around | dancing", "to keep you in my world. | held close"]),
"blood-oh-once-you-called": (
    ["Blood oh once you called to me | red", "Where does our pain go | heavy"],
    ["Leave you may, | leaving", "When we grew | grow tall"]),
"california": (
    ["There is a strange haze over the valley | mist", "Oh bruised, empty, raw dirt | stone"],
    ["It reminds me of home | home", "And the valley sings and laughs | laughter", "Look mommy, how grown is your little prince. | grow tall"]),
"dear-bottle": (
    ["I hope you are having a nice adventure without me | the sea", "May you make a new friend who loves you as much as I did. | warm"],
    ["I hope you are having a nice adventure without me | leaving", "I miss you a lot | missing you"]),
"delicate-pieces-before-the-end": (
    ["Full of black haired brown skinned children | skin", "Delicate pieces | shimmer"],
    ["The memories you wish you had | memory", "Seated mischievously | play"]),
"did-you-know": (
    ["Did you know there’s a pale pink before dawn | first light", "the time when the bulbuls duet with the sparrows | birdsong", "A curse of having been in a room so green | green"],
    ["That can jump out of water | free", "What will this boat be when the boats go home | home"]),
"do-you-miss-me": (
    ["you have, and you are indifferent | cold", "I did not. | silence"],
    ["Do you miss me | missing you", "Now that I hide | hiding"]),
"everyday-i-can-spend": (
    ["in the company of those whom I love | warm", "There will come a time, I know there will come a time | the beat"],
    ["But help me if there is not tomorrow. | tomorrow", "Today is a day in the company of those I love. | held close", "Help me if there is no memory before today. | memory"]),
"everytime-you-wink-at-me": (
    ["I wonder if my heart skipped a beat | the beat", "Or if I just forgot to breath | breath"],
    ["Everytime you wink at me | falling in love", "I wonder if the excitement can bubble up my chest | laughter"]),
"everywhere-i-turn": (
    ["I see a world a little colder | cold", "In the flutter of the leaves | wind", "A heart a little stiller and laughter little less. | silence"],
    ["the remembrance of your laugh | laughter", "In the follow of your face and rememberance of a smile | missing you", "I see a world a little colder | goodbye"]),
"falling-in-love": (
    ["under a waterfall | the river", "in the sun | full sun", "You can breath | breath"],
    ["Falling in love with who I could be | falling in love", "Of being naked | free"]),
"freedom-yet-unabridged": (
    ["Grey and long before me, | grey", "As my feet flew over | wind"],
    ["If I leapt, would the pang stay? | free", "Grey and long before me, | the long road", "Something long thought forgotten. | memory"]),
"glass-houses": (
    ["A ledge here | stone", "Final solitude as the madness of age set in | silence"],
    ["To build our houses | home", "Comfort till death. | goodbye", "You would think we were going to live for eternity | tomorrow"]),
"guadalajara": (
    ["I feel blood and strife and fear | red", "the trees men make | bark"],
    ["I see fear in the eyes | fear", "a time to fall | the fall", "Tall, sightless, reaching as did their ancestors | grow tall"]),
"hark-my-love": (
    ["Look at it glow, | shimmer", "It’s dancing now, in the morning wind | wind", "Or clump of sand | sand"],
    ["It’s dancing now, in the morning wind | dancing", "Dream, dream dream, little tree | grow tall", "Calling their way home | home"]),
"have-you-ever-seen": (
    ["As the world reflected in drops of dew | dew", "Hanging off a cedar | bark"],
    ["Something so beautiful | awe", "That saw your parents parents parents parents | memory"]),
"have-you-watched-creepers-creep": (
    ["The most arduous of grounds | stone", "Come watch creepers creep | green"],
    ["Evolved to find the smallest of holes | hiding", "Come watch creepers creep | grow tall", "Traversing barriers | the long road"]),
"hey-you-there-hey-you-here": (
    ["your breath got caught in my air | breath", "your shoulder got caught in my shirt | skin"],
    ["we got stuck together somehow | held close", "is that mine or is that yours | falling in love"]),
"hey-you-tree-there": (
    ["those gashes those gouges in your trunk | bark", "you can’t even find or make a grape of light | soft light"],
    ["just growth growth growth | grow tall", "have you ever seen an elephant actually frightened of a mouse | fear"]),
"how-can-you-just-be-gone": (
    ["With an empty space | silence", "It’s just deeply sad. | grey"],
    ["This space that was your empty space | the empty space", "I will miss you my friend | missing you", "How can you just be gone | goodbye"]),
"i-feel-sad-about-endings": (
    ["Like when it's too humid for your hair | rain", "It's nice finding a mirror that actually lets us see ourselves | shimmer"],
    ["This might be the last time you are this person | goodbye", "Come, let me home. | home"]),
"i-left-my-heart-at-home-today": (
    ["the chest feels strange | heavy", "something was forgotten | silence"],
    ["I left my heart at home today | leaving", "Who was supposed to remember some parts of you | memory"]),
"i-listen": (
    ["This time when the silence comes | silence", "Let the guillotine come in the night | the dark", "No respite on a beach | sand"],
    ["Is it better to know this is your last goodbye | goodbye", "The timing is never right until there is no time at all | the wait"]),
"i-saw-something-beautiful-today": (
    ["Clad and a shimmer of red | red", "Brown against the sun | full sun", "Shimmer me brighter, you. | shimmer"],
    ["I saw something beautiful today | awe", "Oh Creator | prayer"]),
"i-was-feeling-sorry-for-a-moth": (
    ["wings stuck in candle wax. | warm", "Squirming next to certain doom | the dark"],
    ["Some creature without full understanding of its wings | free", "To our slow demise | goodbye"]),
"i-watch-my-hair": (
    ["Turn golden | low sun", "Of reds and greens | red", "I just went and called it all black. | the dark"],
    ["that this dazzling array | awe", "Fool that I was | laughter"]),
"i-watched-a-butterfly-today": (
    ["It was beautiful and orange | orange", "Caught in the draft of my passage. | wind"],
    ["Fluttered its wings | dancing", "I heard the slight thud | the fall"]),
"i-will-always-be-a-poet": (
    ["If you sand away my finger tips I will be a poet | skin", "With my blood I will paint you with poetry | red"],
    ["I will always be a poet | free", "If you shave my chest to expose my heart | hiding"]),
"in-my-heart-something-called-to-the-rain": (
    ["In my heart something called to the rain | rain", "Being Life's chartreuse-clad champion, | green", "Heretic before Dawn | first light"],
    ["And be reborn, oak grow tall, pine grow fierce | grow tall", "To the drowning man | fear"]),
"it-used-to-be-me": (
    ["writhing under you | skin", "or riding beside you | wind"],
    ["it used to be me | memory", "writhing under you | held close"]),
"its-funny": (
    ["Under orange lights | orange", "And warm nights | warm"],
    ["Down the long roads | the long road", "Oh yes, the day I fell in love with you | falling in love", "Being apart from you | missing you"]),
"kashmir": (
    ["Till time razes these mountains to the ground | stone", "And man builds new idols. | heavy"],
    ["As I look and wonder | awe", "Memories mine own | memory", "That which has to be done | prayer"]),
"large-objects": (
    ["Large objects exert a gravitational pull | heavy", "That thing which binds you to them is now alive with its own force | the beat"],
    ["That thing which binds you to them | held close", "What about when the relationship matters more than the person | falling in love"]),
"late-why-so-late": (
    ["The cab really smells. | smell", "keep his breath intertwined a little a little a little | breath"],
    ["Maybe we should have gone to the airport instead of napping. | leaving", "10 min to discover check-in opens 24 hours before. | the wait", "Make the humans bored and they will dance. | dancing"]),
"let-tomorrow-come": (
    ["Let tomorrow come for today has no brother | first light", "Let tomorrow come for today has no cousin | the beat"],
    ["when tomorrow is all we have. | tomorrow", "Let tomorrow come for that fear and heart of mine | fear", "that asked for today | the wait"]),
"london": (
    ["There’s a coldness in the air | cold", "You, my dark friend, might just be | the dark"],
    ["they are scared to look too long | fear", "They don’t look at you too long | hiding"]),
"mama": (
    ["As the sun set and we had | low sun", "You’ve gone into that gentle night, | the dark", "Or a whiskey | warm"],
    ["Sweet mama, sweet father, sweet husband, sweet friend. | goodbye", "And made a space filled with love | the empty space", "so close to his heart | held close"]),
"memories-of-tomorrow": (
    ["at the hazy notes of tomorrow, | mist", "After all, the trees are there | bark"],
    ["remember today? | memory", "when I, tomorrow, | tomorrow"]),
"my-friend-who-died": (
    ["English has no imperfect | silence", "It's too bad | grey"],
    ["My friend who died | goodbye", "That existed | memory", "And will exist | tomorrow"]),
"not-in-my-life": (
    ["Of associating with filth | smell", "I will not speak to you | silence"],
    ["Walk out that door | leaving", "You do not mean well | fear"]),
"oh-that-again": (
    ["As a single flower | in bloom", "Opened and yet unmarked | soft light"],
    ["Oh that again I might see such beauty in my life | awe", "Ungrieved by the world | grow tall"]),
"oh-the-horror-i-say": (
    ["Emincer amongst the carrots | orange", "A finger on nicely chopped | skin"],
    ["Oh the horror I say | fear", "As though it too, was just another carrot | hiding"]),
"one-beautiful-moment": (
    ["Bring the slightly chilled blood | cold", "And feel veins on your fingers | skin", "The world has stopped | silence"],
    ["You can just be. | free", "That, my friends, is the moment before death. | goodbye", "Where you don’t have to decide anything | the wait"]),
"one-in-community": (
    ["caught in a flick of wind | wind", "the sand asks me, observing, sighing by | sand"],
    ["Who chooses fear. | fear", "how do I grow when you defined me to be a thing. | grow tall"]),
"out-of-many-one": (
    ["Kiss me love | skin", "There was, once. | silence"],
    ["I’m fucking free. | free", "There was joy, once. | memory"]),
"out-to-play-he-calls-them": (
    ["Swim to me, swim to me, swim to me | the sea", "One, two, they come in a line | the beat"],
    ["Out to play He calls them | play", "One, two, they fly West. | leaving"]),
"park": (
    ["A whisper of red | red", "And old dogs teaching new tricks and a delight of flowers | in bloom", "On a sunny day | full sun"],
    ["Seen to be alone | alone", "Fear is a spiral | fear", "and I'm gone. | leaving"]),
"platitudes-of-suffering": (
    ["For does breath not still shake my body? | breath", "that we shall lay down our Labors, | heavy"],
    ["For it is only in death, | goodbye", "So, Sir, ask me not how I am. | hiding"]),
"sit-let-us-listen": (
    ["Sit let us listen to the sound of this moment | silence", "The wind | wind", "And in the flowers | in bloom"],
    ["Watch the game board | play", "All that is today and will be | tomorrow", "See the leaves | the wait"]),
"social-media-is-not-the-right-place-for-grief": (
    ["Or the divinity in choosing a temporary voicelessness | silence", "a thought in a stone | stone"],
    ["Like temple | prayer", "It's kind of freeing | free", "I'm not ready to move on | goodbye"]),
"sometimes-curious-feel": (
    ["Is pleasantly warm | warm", "I think I've walked this fair green | green", "It's a light pressure on the nose | skin"],
    ["There's a joy bubbling in my heart | laughter", "I love you | falling in love"]),
"sometimes-i-feel-cold": (
    ["I feel cold when I be with you | cold", "I am tired of being tired | heavy"],
    ["I want a different game to play | play", "I want to construct a different home | home", "I feel like an intersection of regrets and what could have been | memory"]),
"sometimes-i-listen-to-these-poets": (
    ["Is there a pure form of vomit too | smell", "go on and on | the beat"],
    ["our capacity for wonder. | awe", "the purest form of love | falling in love"]),
"sometimes-quaver": (
    ["Sometimes to watch the whole field a'quaver | wind", "Feet so fast a'flutter | the beat"],
    ["Is to see leaves dancing a tiny dance | dancing", "Am I moving slow? | the wait"]),
"song-of-tomorrow": (
    ["Crookedly yearning towards the lights | soft light", "Of disasters foreshadowed | the dark"],
    ["Grow tall | grow tall", "Tell me, is it tomorrow? | tomorrow", "Come back to me | missing you"]),
"teental": (
    ["are we floating now or chasing the beat | the beat", "Or 6th beat have you fallen soft | silence"],
    ["te left again and we close in on home | home", "a dancer who can’t keep attention for 4 beats | dancing", "life is a game, and nothing is what it seems. | play"]),
"the-light-sings": (
    ["the light sings to me in the morning | soft light", "But then it rains and I wonder about the birds | rain", "they drown out the birds. | birdsong"],
    ["hunger drives them forth from sanctuary | leaving", "change or die, says the rain. | fear"]),
"the-mist": (
    ["In the morning you can listen to the mist. | mist", "Their kiss is soft and cool on my skin | skin", "When I first came out I saw the drops of dew | dew"],
    ["If you sit still and don't move your eyes you can see it fleeing. | the wait", "oh this is the ocean, come to play in the air for a while | play"]),
"the-sun-kissed-the-mountains": (
    ["The sun kissed the mountains | low sun", "Peaks in harsh repose | stone"],
    ["The babe of tomorrow has been born. | tomorrow", "By the grace of God | prayer"]),
"there-comes-a-point": (
    ["Not from loss of blood. | red", "That weariness that grows, | heavy"],
    ["There comes a point one chooses death. | goodbye", "Why, again, today? | the wait"]),
"there-is-a-soft-tingle": (
    ["Its soft bark and slowly molding hardwood | bark", "There is a soft tingle I feel | skin"],
    ["The biggest and oldest tree | grow tall", "Long dead, though it may be | goodbye"]),
"these-days-are-gone": (
    ["who has hardened? | stone", "Harden or rot, they say. | smell"],
    ["these days are gone | memory", "Let there be joy that it happened. | laughter"]),
"these-water-nymphs": (
    ["They come up from the River | the river", "Have you ever felt hands | skin"],
    ["Creator, Destroyer, bringer of the Day. | prayer", "They kissed your lips as they went by | falling in love"]),
"this-growing-older": (
    ["And made warm | warm", "Softly inviting | soft light"],
    ["If this goodbye is the last | goodbye", "Will the space that I feel | the empty space", "This growing older | grow tall"]),
"thrum-thrum": (
    ["thrum thrum | the beat", "We need the harshness of purple, or red | red", "Violet is too gentle of a flower. | in bloom"],
    ["remembered mistakes | memory", "colors to express my unease | fear"]),
"time-in-a-fig-grove": (
    ["Then a stream. | the river", "Rooted in a climb of dirt | green"],
    ["And the Grove grew and grew and grew | grow tall", "And he looked down the Long Years, | the long road", "Then came a house. | home"]),
"to-be-alone": (
    ["For babies who like the snow | cold", "And dreaming about green grass | green"],
    ["To be alone | alone", "and wander | the long road"]),
"to-flutter": (
    ["It’s a cold wind that blows from the north | wind", "Sends my heart a’flutter. | the beat"],
    ["But you pause, a’wondering | the wait", "Sends my heart a’flutter. | falling in love"]),
"to-know-me": (
    ["Kiss me and I’ll smile, because I love smiling | skin", "Love means a lot | warm"],
    ["Because I laugh a lot | laughter", "And I fall in love a lot | falling in love"]),
"to-see-such-beauty": (
    ["Why you, Orange | orange", "To stand in a field | green"],
    ["To see such beauty | awe", "Or the side of a road | the long road", "I didn’t know I had seen you before. | memory"]),
"to-touch-in-a-way": (
    ["To touch | skin", "if I can take | silence"],
    ["gives remembrance | memory", "in a way | held close"]),
"today-birds": (
    ["We are past the morning of the small birds | birdsong", "It’s cold in these waters | cold", "Though the sea is warm | the sea"],
    ["What a curse, to be an island. | alone", "I hear my time calling | goodbye", "What brings a fish to delight in the air? | free"]),
"today-i-saw-a-man-on-a-leash": (
    ["In the forest, the elephant walks far more silently than the man. | silence", "It was an elephant leash | heavy"],
    ["It was hard to tell which person was being held | held close", "Easily broken | free"]),
"today-i-write-about-red": (
    ["Today I write about Red | red", "Murderer of green into the turgid hell of Brown | green", "Sister of Black. | the dark"],
    ["My beautiful sister. | held close", "I can’t wait to make purple once more. | the wait"]),
"today-if-there-is-tomorrow": (
    ["when the rains fall without end | rain", "Where did the birds go | birdsong"],
    ["Into tomorrow, I say, and fight me if I’m wrong. | tomorrow", "Where do we go when our hearts quail from fright? | fear", "Where do we go when we leave this life? | goodbye"]),
"wedding-poem": (
    ["under orange lights and in empty roads | orange", "the rains are yet to start | rain", "in that brief wisp of spring | green"],
    ["Like falling in love. | falling in love", "Time to scurry home | home", "these days are still like that first day | memory"]),
"when-i-dance-with-you": (
    ["Your breath is my breath | breath", "I don’t know where my body ends | skin"],
    ["When I dance with you | dancing", "And your tomorrow is my tomorrow | tomorrow", "Joined with another | held close"]),
"when-i-laugh": (
    ["There is this warm glow | warm", "On a cold day | cold", "In a dark brown sea. | the sea"],
    ["When I laugh | laughter", "And all that’s left is a memory | memory"]),
"when-im-not-here": (
    ["The curve of your back | skin", "That woke you up in the middle of the night | the dark"],
    ["When I'm not here | missing you", "With a little gap | the empty space", "And pull towards me | held close"]),
"when-you-watch-the-whales-from-shore": (
    ["As you see the great plumps of white rise in the hosts by sea | the sea", "Smell the breath | smell"],
    ["And how huge and mighty whales must be. | awe", "Surrender to the powerful we are taught, | fear"]),
"when-you-were-young": (
    ["In the woods. | green", "On a Saturday. | full sun"],
    ["For me to claim a name or a face. | hiding", "Like a game with some new friends. | play"]),
"xoxo": (
    ["Xoxo | skin", "To be surrounded by; | warm"],
    ["To be surrounded by; | held close", "so much love, | falling in love"]),
"i-came-out": (
    ["It runs from the invading sun | full sun", "oh, yes, this is the ocean, just come to play | the sea", "When I first came out I saw the drops of dew | dew"],
    ["When I first came out | free", "Thinking maybe today, maybe this day, even if I don’t win, one of us will. | tomorrow"]),
"being-loved": (
    ["there was a soft breeze | wind", "It is hazy the way that memories are remembered in the after. | mist", "the rush of warmth masquerading as joy | warm"],
    ["I remember the swing. | play", "Hasn’t wonder always been subjugated by shame? | hiding", "Back door swung open and there she stood | home"]),
"animals-in-love": (
    ["until the putrid smell called for the investigation | smell", "Or a stream. | the river", "Tearing at it with our hands. | skin"],
    ["We’re in love until we’re not, amirite? | falling in love", "You who I knew, or me before you died. | goodbye", "Quick, a game. | play"]),
"wrestle": (
    ["But beautifies to purple in the light | soft light", "Substance too thick congeals so dark | the dark", "My short breath tells me | breath"],
    ["I have done something wrong | hiding", "But damn it does start to change | grow tall"]),
"bladder-bag": (
    ["I, bladder bag, am made cold again | cold", "where did that warmth that surrounded me once go | warm"],
    ["She this whale I once was takes me with a soft hand | held close", "I am reborn as bag. | tomorrow"]),
"hey": (
    ["your breath got caught in my air | breath", "*beat* | the beat"],
    ["we got stuck together somehow | held close", "is that yours or is that mine | falling in love"]),
}

# photo file stem: (senses words, feelings words)
PHOTOS = {
"roma-sidewalk": ("the dark, silence", "alone, fear, hiding"),
"papel-picado": ("the dark, warm, wind, the beat", "falling in love, dancing"),
"night-street": ("the dark, silence", "the long road, the empty space, fear"),
"staircase": ("the dark, warm", "the wait, alone"),
"cdmx-plaza": ("the dark, silence, stone", "the empty space, alone"),
"alpine-lake": ("cold, stone, wind", "awe"),
"beach-solitude": ("the sea, sand, full sun, birdsong", "alone, free"),
"reed-corridor": ("wind, full sun, sand", "the long road, hiding"),
"buoys-wall": ("sand, warm, full sun", "home, the wait"),
"fireworks-water": ("the dark, shimmer, the beat", "laughter, free"),
"still-lake": ("silence, grey, first light, cold", "the wait, awe"),
"sayulita-staircase": ("the dark", "missing you, alone, the wait"),
"concrete-museum": ("stone, silence, heavy", "the empty space"),
"tree-tunnel": ("green, soft light, bark", "the long road, grow tall"),
"hawaii-landscape": ("stone, low sun", "goodbye, awe"),
"lanterns": ("warm, the dark, shimmer", "home"),
"taco-cart": ("warm, smell, the dark", "home, the wait"),
"night-market": ("warm, smell, the dark", "the wait, laughter"),
"misty-hillside": ("mist, cold, breath", "leaving, the long road"),
"kitchen-night": ("warm, the beat, smell", "dancing, home, laughter"),
"restaurant-night": ("the dark, warm, silence", "hiding, the empty space, home"),
"yosemite-trail": ("stone, heavy, low sun", "awe, the long road"),
"scooter-beach": ("the sea, stone", "play, free"),
"yosemite-valley": ("stone, full sun", "the long road, alone, grow tall"),
"beach-boardwalk": ("grey, sand", "leaving, the long road, tomorrow"),
"berlin-street": ("grey, the beat", "memory, tomorrow"),
"singapore-225bdfc9": ("the sea, shimmer, warm", "the wait, alone, free"),
"sagrada-familia-barcelona-e210fc03": ("soft light, stone", "prayer, awe, grow tall"),
"kodagu-india-346cc700": ("the river, stone", "the long road"),
"kodagu-india-033e7e3b": ("dew, first light, shimmer", "tomorrow, the wait"),
"kodagu-india-124b384b": ("mist, the river, first light, birdsong", "tomorrow, awe"),
"kodagu-india-68c68cb1": ("mist, first light, birdsong, dew", "grow tall, tomorrow"),
"crested-butte-colorado-8ada8f57": ("cold, bark, full sun", "play, free"),
"crested-butte-colorado-e25ede7f": ("cold, low sun, bark", "alone, free"),
"puako-hawaii-98409f6b": ("bark, stone, grey, the sea", "goodbye, alone"),
"laupahoehoe-hawaii-96a28c20": ("mist, the river, green, rain", "awe, hiding"),
"hilo-hawaii-3cb5d78d": ("rain, green, bark", "grow tall, the long road, the empty space"),
"hilo-hawaii-a09cc2ce": ("orange, red", "prayer, home"),
"hilo-hawaii-fa94384a": ("green, the river, in bloom", "the fall, hiding"),
"hilo-hawaii-ea929e41": ("the sea, grey", "play, alone"),
"hawaii-volcanoes-national-park-8e2b64e2": ("rain, green", "alone, the long road"),
"kaanapali-maui-2be2cfcb": ("the sea, breath, stone", "free"),
"mount-rainier-national-park-washington-ddab98b6": ("low sun, bark, heavy", "the fall, the long road"),
"mount-rainier-national-park-washington-d72b8203": ("soft light, bark", "grow tall, prayer"),
"mount-rainier-national-park-washington-5c7590f5": ("shimmer, bark", "grow tall, awe"),
"mount-rainier-national-park-washington-9ca71603": ("low sun, the dark, bark", "the fall, goodbye, fear"),
"mount-rainier-national-park-washington-3d887df3": ("cold, skin", "free, alone"),
"mount-rainier-national-park-washington-bbda096c": ("cold, silence, skin", "awe, the wait"),
"san-juan-islands-washington-657f1936": ("the sea, full sun", "home, the wait"),
"fire-island-new-york-72585dde": ("sand, wind", "leaving, the long road"),
"washington-dc-c631b9f2": ("the dark, silence, stone", "memory, alone, the empty space"),
"washington-dc-afd19b1c": ("soft light, silence, stone", "memory, alone"),
"acadia-national-park-maine-9678573e": ("silence, stone, full sun", "the wait"),
"bar-harbor-maine-bb0a8fe5": ("red, green", "the fall, goodbye"),
"casper-wyoming-02035a8d": ("soft light, smell", "leaving, memory, missing you"),
"casper-wyoming-cce8cbde": ("wind, cold", "alone, leaving"),
"mexico-city-mexico-6eb743ec": ("first light, mist, orange", "free, tomorrow, awe"),
"diamante-valley-costa-rica-3092189d": ("dew, green, mist", "tomorrow, grow tall"),
"diamante-valley-costa-rica-cbb914b4": ("first light, mist, breath", "prayer, the wait"),
"paro-bhutan-08988839": ("red, in bloom, bark", "grow tall"),
"paro-bhutan-6f8bbbbf": ("wind, red", "prayer, free"),
"wangdue-phodrang-bhutan-d0e1e540": ("cold, stone", "alone, the long road"),
"provincetown-massachusetts-f214fa8d": ("sand, grey, wind", "leaving, missing you, the long road"),
"provincetown-massachusetts-a90962e6": ("full sun, skin, sand", "hiding, the wait"),
"provincetown-massachusetts-ee073946": ("full sun, shimmer, skin, the sea", "hiding, free"),
"provincetown-massachusetts-4c281798": ("low sun, wind", "held close, play, dancing"),
"provincetown-massachusetts-eee28b60": ("low sun, wind", "held close, dancing"),
"provincetown-massachusetts-08da554d": ("low sun, wind, the sea", "held close, play"),
"provincetown-massachusetts-09009fdd": ("skin, low sun, the sea", "play, laughter, free"),
"honshu-japan-0d03d128": ("silence, bark", "leaving, held close, prayer"),
"setonaikai-national-park-japan-64937bce": ("the dark, shimmer", "falling in love, memory"),
"setonaikai-national-park-japan-4d3f9e95": ("soft light, shimmer", "the long road"),
"roppongi-tokyo-a5f50e72": ("in bloom, green", "grow tall, falling in love"),
"sayulita-mexico-25fbaafd": ("low sun, orange, warm, sand", "the wait, goodbye"),
"sayulita-mexico-9d65e1b6": ("low sun, sand, the sea", "alone, goodbye"),
"mariposa-grove-yosemite-e6c620bb": ("bark, heavy", "grow tall, memory"),
"mariposa-grove-yosemite-7455e25e": ("bark, grey", "grow tall, awe"),
}

APOS = str.maketrans({"'": "’", "’": "'"})


def find_verbatim(phrase, text):
    """Return the phrase as it appears in text (apostrophes only may differ), or None."""
    if phrase in text:
        return phrase
    # try every combination of apostrophe style: flip all, then flip none — poems are consistent within themselves
    flipped = phrase.translate(APOS)
    if flipped in text:
        return flipped
    for a, b in (("'", "’"), ("’", "'")):
        alt = phrase.replace(a, b)
        if alt in text:
            return alt
    return None


def main():
    data = json.loads((ROOT / "v2/data.json").read_text())
    texts = {p["slug"]: "\n".join(p["stanzas"]) for p in data["poems"]}
    srcs = {Path(p["src"]).stem: p["src"] for p in data["photos"]}
    errors = []
    out = {"made_by": "studies/15/build.py", "vocabs": {}}
    for vi, vocab in enumerate(("senses", "feelings")):
        words = WORDS[vocab]
        poems, photos = {}, {}
        for slug, pair in POEMS.items():
            if slug not in texts:
                errors.append(f"unknown poem {slug}")
                continue
            doors = []
            for d in pair[vi]:
                phrase, word = (s.strip() for s in d.rsplit("|", 1))
                if word not in words:
                    errors.append(f"{vocab}: {slug}: word '{word}' not in vocabulary")
                v = find_verbatim(phrase, texts[slug])
                if v is None:
                    errors.append(f"{vocab}: {slug}: not in poem: {phrase!r}")
                    continue
                doors.append({"phrase": v, "word": word})
            poems[slug] = doors
        for stem, pair in PHOTOS.items():
            if stem not in srcs:
                errors.append(f"unknown photo {stem}")
                continue
            ws = [w.strip() for w in pair[vi].split(",")]
            for w in ws:
                if w not in words:
                    errors.append(f"{vocab}: photo {stem}: word '{w}' not in vocabulary")
            photos[srcs[stem]] = ws
        index = [{"word": w,
                  "poems": [s for s, ds in poems.items() if any(d["word"] == w for d in ds)],
                  "photos": [s for s, ws in photos.items() if w in ws]} for w in words]
        out["vocabs"][vocab] = {"words": index, "poems": poems, "photos": photos}
    missing = set(texts) - set(POEMS)
    if missing:
        errors.append(f"poems with no doors: {sorted(missing)}")
    missing = set(srcs) - set(PHOTOS)
    if missing:
        errors.append(f"photos with no words: {sorted(missing)}")
    if errors:
        print("\n".join(errors))
        sys.exit(1)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    for vocab, v in out["vocabs"].items():
        print(vocab, len(v["words"]), "words")
        for w in v["words"]:
            print(f"  {w['word']:<16} {len(w['poems']):>3} poems {len(w['photos']):>3} photos")


if __name__ == "__main__":
    main()
