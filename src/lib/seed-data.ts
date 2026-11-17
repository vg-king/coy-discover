import { Prisma, PrismaClient, SwipeDirection } from "@/generated/prisma/client";
import { avatarUrl } from "@/lib/avatar";

const MOCK_PROFILES = [
  { id: "u1",  name: "Aarav Sharma",      age: 21, city: "IIT Delhi",           bio: "Chai over coffee, always. Building robots when I'm not binge-watching sci-fi.",           interests: ["Robotics", "Sci-Fi", "Chai", "Cricket"] },
  { id: "u2",  name: "Diya Patel",        age: 20, city: "NID Ahmedabad",       bio: "Designing the future one pixel at a time. Dog mom to a golden retriever named Mango.",     interests: ["UI Design", "Dogs", "Pottery", "Hiking"] },
  { id: "u3",  name: "Vihaan Reddy",      age: 23, city: "Hyderabad",           bio: "Full-stack dev by day, stand-up comedian by very late night.",                              interests: ["Coding", "Stand-up Comedy", "Biryani", "Football"] },
  { id: "u4",  name: "Ananya Iyer",       age: 19, city: "IIT Madras",          bio: "Quantum physics nerd who also does Bharatanatyam. Contradictions are my thing.",            interests: ["Physics", "Dance", "Reading", "Yoga"] },
  { id: "u5",  name: "Kabir Malhotra",    age: 24, city: "Mumbai",              bio: "Startup founder running on black coffee and big dreams.",                                   interests: ["Startups", "Coffee", "Surfing", "Photography"] },
  { id: "u6",  name: "Meera Nair",        age: 22, city: "BITS Pilani",         bio: "Guitar player, sunset chaser, and aspiring astrophysicist.",                                interests: ["Guitar", "Astronomy", "Travel", "Painting"] },
  { id: "u7",  name: "Rohan Gupta",       age: 25, city: "Bangalore",           bio: "Product manager who thinks in frameworks and eats in buffets.",                              interests: ["Product Design", "Food", "Gym", "Chess", "Podcasts"] },
  { id: "u8",  name: "Ishita Kapoor",     age: 20, city: "St. Xavier's Mumbai", bio: "English lit major with strong opinions about Oxford commas.",                               interests: ["Literature", "Writing", "Theatre", "Coffee"] },
  { id: "u9",  name: "Arjun Singh",       age: 26, city: "Delhi",               bio: "Photographer documenting street food stalls across India.",                                 interests: ["Photography", "Street Food", "Travel", "History"] },
  { id: "u10", name: "Priya Krishnan",    age: 21, city: "IISC Bangalore",      bio: "ML researcher who thinks neural nets are poetry.",                                          interests: ["Machine Learning", "Poetry", "Running", "Tea"] },
  { id: "u11", name: "Aditya Joshi",      age: 23, city: "Pune",                bio: "Open-source contributor and competitive programmer. I think in O(n).",                      interests: ["Competitive Programming", "Open Source", "Anime", "Table Tennis"] },
  { id: "u12", name: "Nisha Verma",       age: 19, city: "NIFT Delhi",          bio: "Fashion design student with a secret love for astrophotography.",                           interests: ["Fashion", "Astrophotography", "Sketching", "K-pop"] },
  { id: "u13", name: "Siddharth Menon",   age: 27, city: "Kochi",               bio: "Marine biologist who surfs before work and reads after.",                                   interests: ["Marine Biology", "Surfing", "Reading", "Cooking"] },
  { id: "u14", name: "Riya Deshmukh",     age: 22, city: "COEP Pune",           bio: "Civil engineer who also builds sandcastles competitively. Yes, that's real.",               interests: ["Engineering", "Sandcastles", "Volleyball", "Gardening"] },
  { id: "u15", name: "Karthik Sundaram",  age: 24, city: "Chennai",             bio: "Film buff who reviews every movie he watches in exactly 3 sentences.",                      interests: ["Cinema", "Writing", "Basketball", "Cooking"] },
  { id: "u16", name: "Zara Sheikh",       age: 20, city: "Jamia Millia Delhi",  bio: "Journalism student, amateur boxer, and professional overthinker.",                          interests: ["Journalism", "Boxing", "Philosophy", "Music"] },
  { id: "u17", name: "Devansh Tiwari",    age: 28, city: "Lucknow",             bio: "Lawyer by profession. Baker by passion. Kebab connoisseur by birth.",                       interests: ["Law", "Baking", "Kebabs", "Classical Music", "Debate"] },
  { id: "u18", name: "Tanvi Bhatt",       age: 21, city: "IIM Ahmedabad",       bio: "MBA student who'd rather be trekking in the Himalayas.",                                   interests: ["Trekking", "Strategy Games", "Podcasts", "Yoga"] },
  { id: "u19", name: "Harsh Agarwal",     age: 22, city: "Jaipur",              bio: "Heritage architect restoring havelis and eating dal baati in between.",                     interests: ["Architecture", "History", "Food", "Cycling"] },
  { id: "u20", name: "Sneha Kulkarni",    age: 25, city: "Bangalore",           bio: "Data scientist by day, Carnatic vocalist by evening, Netflix by night.",                    interests: ["Data Science", "Carnatic Music", "Netflix", "Dogs"] },
  { id: "u21", name: "Pranav Chopra",     age: 23, city: "ISB Hyderabad",       bio: "Finance bro who secretly writes poetry in Urdu.",                                           interests: ["Finance", "Urdu Poetry", "Squash", "Crypto"] },
  { id: "u22", name: "Aisha Rahman",      age: 19, city: "AMU Aligarh",         bio: "History major with a passion for calligraphy and cold coffee.",                             interests: ["History", "Calligraphy", "Cold Coffee", "Debating"] },
  { id: "u23", name: "Vivek Nambiar",     age: 26, city: "Thiruvananthapuram",  bio: "Game developer making indie games inspired by Kerala folklore.",                            interests: ["Game Dev", "Folklore", "Pixel Art", "Swimming"] },
  { id: "u24", name: "Pooja Saxena",      age: 20, city: "SRCC Delhi",          bio: "Economics student, meme curator, and champion debater.",                                    interests: ["Economics", "Memes", "Debate", "Badminton", "Painting"] },
  { id: "u25", name: "Nikhil Das",        age: 24, city: "Kolkata",             bio: "Documentary filmmaker exploring stories in rural Bengal.",                                  interests: ["Film", "Travel", "Storytelling", "Football"] },
  { id: "u26", name: "Kavya Rao",         age: 22, city: "Manipal",             bio: "Med student who paints watercolors between anatomy chapters.",                              interests: ["Medicine", "Watercolors", "Classical Dance", "Puzzles"] },
  { id: "u27", name: "Rahul Hegde",       age: 27, city: "Bangalore",           bio: "DevOps engineer who automates everything except his dating life.",                          interests: ["DevOps", "Automation", "Craft Beer", "Board Games"] },
  { id: "u28", name: "Simran Kaur",       age: 21, city: "Chandigarh",          bio: "Bhangra dancer, environmental activist, and chai addict.",                                  interests: ["Bhangra", "Environmentalism", "Chai", "Photography"] },
  { id: "u29", name: "Tejas Pillai",      age: 23, city: "NIT Trichy",          bio: "Mech engineering + motorsport nerd. Building an electric go-kart in my hostel.",            interests: ["Motorsport", "EV Tech", "3D Printing", "F1"] },
  { id: "u30", name: "Rhea Chandra",      age: 20, city: "LSR Delhi",           bio: "Psychology student who psychoanalyzes every TV show character.",                             interests: ["Psychology", "TV Shows", "Journaling", "Baking"] },
  { id: "u31", name: "Advait Kulkarni",   age: 25, city: "Pune",                bio: "Jazz pianist and cloud architect. I build in the clouds, literally.",                       interests: ["Jazz", "Cloud Computing", "Coffee", "Meditation"] },
  { id: "u32", name: "Nandini Rajan",     age: 22, city: "IISER Mohali",        bio: "Biochem researcher who runs half-marathons and bakes sourdough.",                           interests: ["Biochemistry", "Running", "Sourdough", "Sci-Fi", "Gardening"] },
];

// Exactly these 7 profiles have a LIKE pointing to "me"
const LIKERS = ["u3", "u7", "u12", "u18", "u22", "u28", "u31"];

export function buildSeedOperations(
  db: Database,
): Prisma.PrismaPromise<Prisma.BatchPayload>[] {
  return [
    db.match.deleteMany(),
    db.swipe.deleteMany(),
    db.user.deleteMany(),
    db.user.createMany({
      data: [
        {
          id: "me",
          name: "You",
          age: 22,
          photoUrl: avatarUrl("me"),
          bio: "This is you — the main character.",
          city: "Your City",
          interests: ["Swiping", "Matching", "Vibing"],
        },
        ...MOCK_PROFILES.map((profile) => ({
          ...profile,
          photoUrl: avatarUrl(profile.id),
        })),
      ],
    }),
    db.swipe.createMany({
      data: LIKERS.map((swiperId) => ({
        swiperId,
        targetId: "me",
        direction: SwipeDirection.LIKE,
      })),
    }),
  ];
}

export async function seedDatabase(db: Database): Promise<void> {
  for (const operation of buildSeedOperations(db)) {
    await operation;
  }
}

export type Database = Pick<PrismaClient, "user" | "swipe" | "match">;

export { MOCK_PROFILES, LIKERS };

