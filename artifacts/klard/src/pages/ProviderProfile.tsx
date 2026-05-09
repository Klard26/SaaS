import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import {
  useGetMyProviderProfile, getGetMyProviderProfileQueryKey,
  useUpdateProvider,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  displayName: z.string().min(2, "Mindestens 2 Zeichen"),
  bio: z.string().optional(),
  city: z.string().min(2, "Stadt ist erforderlich"),
  zip: z.string().min(4, "PLZ ist erforderlich"),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProviderProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useGetMyProviderProfile({
    query: { queryKey: getGetMyProviderProfileQueryKey() },
  });

  const updateProvider = useUpdateProvider();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", bio: "", city: "", zip: "", address: "", phone: "", website: "" },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName ?? "",
        bio: profile.bio ?? "",
        city: profile.city ?? "",
        zip: profile.zip ?? "",
        address: profile.address ?? "",
        phone: profile.phone ?? "",
        website: profile.website ?? "",
      });
    }
  }, [profile, form]);

  async function onSubmit(values: FormData) {
    if (!profile) return;
    try {
      await updateProvider.mutateAsync({ id: profile.id, data: values });
      qc.invalidateQueries({ queryKey: getGetMyProviderProfileQueryKey() });
      toast({ title: "Profil aktualisiert" });
    } catch {
      toast({ title: "Fehler", description: "Profil konnte nicht aktualisiert werden.", variant: "destructive" });
    }
  }

  if (!isLoading && !profile) {
    setLocation("/provider/onboarding");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Profil bearbeiten</h1>
          <Button variant="outline" size="sm" onClick={() => setLocation("/dashboard")} data-testid="button-back-dashboard">
            Zum Dashboard
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Berater-Profil</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField control={form.control} name="displayName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name / Kanzleiname *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-displayName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profilbeschreibung</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} data-testid="textarea-bio" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stadt *</FormLabel>
                        <FormControl><Input {...field} data-testid="input-city" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="zip" render={({ field }) => (
                      <FormItem>
                        <FormLabel>PLZ *</FormLabel>
                        <FormControl><Input {...field} data-testid="input-zip" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl><Input {...field} data-testid="input-address" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl><Input {...field} data-testid="input-phone" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="website" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl><Input {...field} data-testid="input-website" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <Button type="submit" className="w-full" disabled={updateProvider.isPending} data-testid="button-save-profile">
                    {updateProvider.isPending ? "Wird gespeichert..." : "Anderungen speichern"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
