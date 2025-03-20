"use client";

import { supabase } from "../../supabase/supabase";
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
import { Check } from "lucide-react";

export default function PricingCard({ item, user }: {
    item: any,
    user: User | null
}) {

  // Handle checkout process
  const handleCheckout = async (priceId: string) => {

    if (!user) {
      // Redirect to login if user is not authenticated
      window.location.href = "/sign-in";
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-create-checkout', {
        body: {
          productPriceId: priceId,
          successUrl: `${window.location.origin}/dashboard`,
          customerEmail: user.email || '',
          metadata: {
            user_id: user.id,
          } 
        },
        headers: {
          'X-Customer-Email': user.email || '',
        }
      });

      if (error) {
        throw error;
      }

      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } 
  };


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
            {item.description &&<CardContent className="relative">
                <ul className="space-y-4">
                    {item.description.split('\n').map((desc: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                            <span className="text-gray-600">{desc.trim()}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>}
            <CardFooter className="relative">
                <Button 
                    onClick={async () => {
                        await handleCheckout(item?.prices?.[0]?.id)
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