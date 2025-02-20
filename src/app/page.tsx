import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import { api } from "@/lib/polar";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { result } = await api.products.list({
    isArchived: false, // Only fetch products which are published
    organizationId: process.env.POLAR_ORGANIZATION_ID!,
  })

  return (
    <>
      <Navbar />
      <Hero />
      <main className="w-full bg-white py-8">
        <div className="container mx-auto px-4">
          {result?.items?.map((item) => (
            <PricingCard key={item.id} item={item} user={user} />
          ))}
        </div>
      </main>
    </>
  );
}
