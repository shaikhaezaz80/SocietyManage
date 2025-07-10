import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVisitorSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Camera, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { z } from "zod";

const visitorFormSchema = insertVisitorSchema.extend({
  flatNumber: z.string().min(1, "Flat number is required")
});

interface VisitorFormProps {
  onSuccess?: () => void;
}

export default function VisitorForm({ onSuccess }: VisitorFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof visitorFormSchema>>({
    resolver: zodResolver(visitorFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      visitorType: "guest",
      flatNumber: "",
      purpose: "",
      vehicleNumber: "",
      flatId: 0,
      societyId: user?.societyId || 1
    }
  });

  const createVisitorMutation = useMutation({
    mutationFn: async (data: z.infer<typeof visitorFormSchema>) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await apiRequest("POST", "/api/visitors", formData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitors"] });
      toast({
        title: t('success'),
        description: t('visitorAddedSuccess'),
      });
      form.reset();
      setPhotoFile(null);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof visitorFormSchema>) => {
    createVisitorMutation.mutate(data);
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const visitorTypes = [
    { value: 'guest', label: t('guest') },
    { value: 'delivery', label: t('delivery') },
    { value: 'service', label: t('serviceProvider') },
    { value: 'cab', label: t('cabDriver') },
    { value: 'vendor', label: t('vendor') }
  ];

  const flats = [
    { value: "1", label: "A-101 (Raj Patel)" },
    { value: "2", label: "A-102 (Priya Sharma)" },
    { value: "3", label: "B-201 (Amit Kumar)" },
    { value: "4", label: "B-202 (Neha Singh)" },
    { value: "5", label: "C-301 (Rohit Gupta)" }
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="visitorType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('visitorType')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectVisitorType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {visitorTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('visitorName')}</FormLabel>
              <FormControl>
                <Input placeholder={t('enterVisitorName')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('mobileNumber')}</FormLabel>
              <FormControl>
                <Input placeholder="+91 XXXXX XXXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="flatNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('visitingFlat')}</FormLabel>
              <Select onValueChange={(value) => {
                field.onChange(value);
                form.setValue('flatId', parseInt(value));
              }}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectFlat')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {flats.map((flat) => (
                    <SelectItem key={flat.value} value={flat.value}>
                      {flat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vehicleNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('vehicleNumber')} ({t('optional')})</FormLabel>
              <FormControl>
                <Input placeholder="GJ 01 AB 1234" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('purposeOfVisit')} ({t('optional')})</FormLabel>
              <FormControl>
                <Textarea placeholder={t('briefPurpose')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>{t('photo')} ({t('optional')})</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={handlePhotoCapture}
              className="hidden"
              id="visitor-photo"
            />
            <label htmlFor="visitor-photo" className="cursor-pointer">
              <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {photoFile ? photoFile.name : t('tapToCapture')}
              </p>
            </label>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-green-500 hover:bg-green-600"
          disabled={createVisitorMutation.isPending}
        >
          {createVisitorMutation.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {t('addVisitorAndSendApproval')}
        </Button>
      </form>
    </Form>
  );
}
