import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/navbar";

export default function Pricing() {
    const tiers = [
        {
            name: "Basic",
            price: "$9",
            description: "Perfect for getting started",
            features: [
                "Up to 5 projects",
                "Basic analytics",
                "24/7 support",
                "1GB storage"
            ],
            cta: "Get Started",
            popular: false
        },
        {
            name: "Pro",
            price: "$29",
            description: "Best for professionals",
            features: [
                "Up to 20 projects",
                "Advanced analytics",
                "Priority support",
                "10GB storage",
                "Custom domains",
                "Team collaboration"
            ],
            cta: "Go Pro",
            popular: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            description: "For large organizations",
            features: [
                "Unlimited projects",
                "Enterprise analytics",
                "Dedicated support",
                "Unlimited storage",
                "Custom integrations",
                "SLA guarantee",
                "Advanced security"
            ],
            cta: "Contact Sales",
            popular: false
        }
    ];

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
                    <p className="text-xl text-muted-foreground">
                        Choose the perfect plan for your needs
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {tiers.map((tier) => (
                        <Card key={tier.name} className={`p-8 rounded-lg ${tier.popular ? 'border-2 border-primary relative' : ''
                            }`}>
                            {tier.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold mb-2">{tier.name}</h2>
                                <div className="mb-2">
                                    <span className="text-4xl font-bold">{tier.price}</span>
                                    {tier.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                                </div>
                                <p className="text-muted-foreground">{tier.description}</p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-center">
                                        <Check className="h-5 w-5 text-green-500 mr-2" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full ${tier.popular ? 'bg-primary' : ''}`}
                                variant={tier.popular ? "default" : "outline"}
                            >
                                {tier.cta}
                            </Button>
                        </Card>
                    ))}
                </div>
            </div>
        </>

    );
}