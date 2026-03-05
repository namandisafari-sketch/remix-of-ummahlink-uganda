import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Heart, Landmark } from "lucide-react";

interface MosqueProject {
  id: string;
  name: string;
  mosque: string;
  description: string;
  goal: number;
  raised: number;
}

const mockProjects: MosqueProject[] = [
  {
    id: "1",
    name: "Masjid Roof Repair",
    mosque: "Masjid Noor, Kampala",
    description: "The roof is leaking during rainy season, affecting the prayer hall. Funds needed for complete roof replacement.",
    goal: 15000000,
    raised: 9200000,
  },
  {
    id: "2",
    name: "Wudu Area Expansion",
    mosque: "Old Kampala Mosque",
    description: "Building new ablution facilities to accommodate growing congregation. Current facilities serve 200, target is 500.",
    goal: 8000000,
    raised: 3500000,
  },
  {
    id: "3",
    name: "Madrasa Classroom Block",
    mosque: "Kibuli Mosque",
    description: "Constructing 4 new classrooms for weekend Islamic school. Over 100 children on the waiting list.",
    goal: 25000000,
    raised: 22000000,
  },
  {
    id: "4",
    name: "Solar Power Installation",
    mosque: "Jinja Road Musallah",
    description: "Installing solar panels to reduce electricity costs and ensure uninterrupted power during prayers.",
    goal: 12000000,
    raised: 1800000,
  },
];

const formatUGX = (amount: number) =>
  `UGX ${(amount / 1000000).toFixed(1)}M`;

const DonationsPage = () => {
  return (
    <div className="container py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">Donation Portal</h1>
        <p className="mt-1 text-muted-foreground">
          Support mosque projects with full transparency. Every shilling counts.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {mockProjects.map((project, i) => {
          const percent = Math.round((project.raised / project.goal) * 100);
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Landmark className="h-4 w-4" />
                    {project.mosque}
                  </div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-foreground">{formatUGX(project.raised)} raised</span>
                      <span className="text-muted-foreground">of {formatUGX(project.goal)}</span>
                    </div>
                    <Progress value={percent} className="h-3" />
                    <p className="mt-1 text-right text-xs text-muted-foreground">{percent}% funded</p>
                  </div>
                  <Button variant="gold" className="w-full gap-2">
                    <Heart className="h-4 w-4" /> Donate via Mobile Money
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DonationsPage;
