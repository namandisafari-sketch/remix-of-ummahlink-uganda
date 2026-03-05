import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Droplets, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AlertType = "janaza" | "sos";

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  time: string;
  location: string;
  mapsLink: string;
  contact: string;
  description: string;
  urgent: boolean;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "janaza",
    title: "Janaza – Br. Yusuf Kabanda",
    time: "Today, 2:00 PM",
    location: "Masjid Noor, Kampala",
    mapsLink: "https://maps.google.com/?q=Kampala+Masjid+Noor",
    contact: "+256 700 123 456",
    description: "Janaza prayer after Dhuhr. Burial at Kololo Muslim Cemetery.",
    urgent: true,
  },
  {
    id: "2",
    type: "sos",
    title: "Urgent: Blood Donation Needed",
    time: "ASAP",
    location: "Mulago Hospital, Ward 4B",
    mapsLink: "https://maps.google.com/?q=Mulago+Hospital",
    contact: "+256 770 987 654",
    description: "Blood type O+ urgently needed for sister Amina. Please come if you can.",
    urgent: true,
  },
  {
    id: "3",
    type: "janaza",
    title: "Janaza – Hajjat Nabirye",
    time: "Tomorrow, 10:00 AM",
    location: "Old Kampala Mosque",
    mapsLink: "https://maps.google.com/?q=Old+Kampala+Mosque",
    contact: "+256 780 555 111",
    description: "Janaza prayer after Fajr. May Allah grant her Jannah.",
    urgent: false,
  },
  {
    id: "4",
    type: "sos",
    title: "Fire: Family Needs Assistance",
    time: "Ongoing",
    location: "Kawempe, Zone 3",
    mapsLink: "https://maps.google.com/?q=Kawempe+Kampala",
    contact: "+256 750 222 333",
    description: "A family of 6 lost their home. Clothes, food, and shelter urgently needed.",
    urgent: true,
  },
];

const AlertsPage = () => {
  return (
    <div className="container py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">Janaza & SOS Alerts</h1>
        <p className="mt-1 text-muted-foreground">Real-time community alerts. Cached for offline viewing.</p>
      </motion.div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {mockAlerts.map((alert, i) => {
          const isJanaza = alert.type === "janaza";
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`relative overflow-hidden ${alert.urgent ? "border-urgent/30" : ""}`}>
                {alert.urgent && (
                  <div className="absolute right-0 top-0 h-1 w-full bg-urgent animate-pulse-urgent" />
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{alert.title}</CardTitle>
                    <Badge variant={isJanaza ? "default" : "urgent"}>
                      {isJanaza ? "Janaza" : "SOS"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{alert.description}</p>

                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2 text-foreground">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {alert.time}
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={alert.mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-primary/30 hover:decoration-primary"
                      >
                        {alert.location}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${alert.contact}`} className="underline decoration-primary/30 hover:decoration-primary">
                        {alert.contact}
                      </a>
                    </div>
                  </div>

                  {alert.type === "sos" && (
                    <Button variant="urgent" size="sm" className="mt-2 w-full gap-2">
                      {alert.title.includes("Blood") ? (
                        <><Droplets className="h-4 w-4" /> I Can Donate</>
                      ) : (
                        <><AlertTriangle className="h-4 w-4" /> I Can Help</>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPage;
