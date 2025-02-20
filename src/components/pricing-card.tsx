"use client";

import { checkoutSessionAction } from "@/app/actions";
import { Button } from "./ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "./ui/card";
import { User } from "@supabase/supabase-js";

export default function PricingCard({ item, user }: {
    item: any,
    user: User | null
}) {

    const handleCheckout = async (price: any) => {
        if (!user) {
            // Redirect to sign in if no user
            window.location.href = '/sign-in';
            return;
        }

        const session = await checkoutSessionAction({
            productPriceId: price.id,
            successUrl: `${window.location.origin}/success`,
            customerEmail: user.email!,
            metadata: {
                userId: user.id,
                email: user.email!,
                subscription: 'true'
            }
        })

        if (!session.url) {
            return;
        }

        window.location.href = session.url!;
    }

    return (
        <Card className={`w-[300px] ${item.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
            <CardHeader>
                {item.popular && (
                    <div className="px-3 py-1 text-sm text-primary-foreground bg-primary rounded-full w-fit mb-2">
                        Most Popular
                    </div>
                )}
                <CardTitle className="text-xl">{item.name}</CardTitle>
                <CardDescription className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${item?.prices?.[0]?.priceAmount / 100}</span>
                    <span className="text-muted-foreground">/month</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {item.description.split('\n').map((desc: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span>•</span>
                            <span>{desc.trim()}</span>
                        </li>
                    ))}
                </ul>
                <ul className="space-y-2">
                </ul>
            </CardContent>
            <CardFooter>
                <Button onClick={async () => {
                    await handleCheckout(item?.prices?.[0])
                }} className="w-full" variant={item.popular ? "default" : "outline"}>
                    Get Started
                </Button>
            </CardFooter>
        </Card>
    )
}