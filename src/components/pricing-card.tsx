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
        <Card className={`w-[350px] relative overflow-hidden ${item.popular ? 'border-2 border-blue-500 shadow-xl scale-105' : 'border border-gray-200'}`}>
            {item.popular && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-30" />
            )}
            <CardHeader className="relative">
                {item.popular && (
                    <div className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-fit mb-4">
                        Most Popular
                    </div>
                )}
                <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">{item.name}</CardTitle>
                <CardDescription className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-bold text-gray-900">${item?.prices?.[0]?.priceAmount / 100}</span>
                    <span className="text-gray-600">/month</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="relative">
                <ul className="space-y-4">
                    {item.description.split('\n').map((desc: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-600">{desc.trim()}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="relative">
                <Button 
                    onClick={async () => {
                        await handleCheckout(item?.prices?.[0])
                    }} 
                    className={`w-full py-6 text-lg font-medium ${
                        item.popular 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                >
                    Get Started
                </Button>
            </CardFooter>
        </Card>
    )
}