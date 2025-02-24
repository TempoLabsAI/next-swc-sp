'use client'
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export default function ManageSubscription({ redirectUrl }: { redirectUrl: string }) {
    const router = useRouter();
    return (
        <Button onClick={() => {
            router.push(redirectUrl)
        }}>
            Manage Subscription
        </Button>
    );
}