import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStaffSchema } from "@shared/schema";
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

const staffFormSchema = insertStaffSchema.omit({ societyId: true });

interface StaffFormProps {
  onSuccess?: () => void;
}

export default function StaffForm({ onSuccess }: StaffFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof staffFormSchema>>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      category: "housekeeping",
      shiftTiming: "morning",
      salary: "0",
      idProofType: "aadhar",
      idProofNumber: "",
      address: "",
      emergencyContact: "",
      assignedFlats: [],
      isActive: true
    }
  });

  const createStaffMutation = useMutation({
    mutationFn: async (data: z.infer<typeof staffFormSchema>) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await apiRequest("POST", "/api/staff", formData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: t('success'),
        description: t('staffMemberAdded'),
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

  const onSubmit = (data: z.infer<typeof staffFormSchema>) => {
    createStaffMutation.mutate(data);
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const staffCategories = [
    { value: 'housekeeping', label: t('housekeeping') },
    { value: 'security', label: t('security') },
    { value: 'maintenance', label: t('maintenance') },
    { value: 'gardening', label: t('gardening') },
    { value: 'management', label: t('management') }
  ];

  const shiftTimings = [
    { value: 'morning', label: t('morning') + ' (6 AM - 2 PM)' },
    { value: 'day', label: t('day') + ' (9 AM - 6 PM)' },
    { value: 'evening', label: t('evening') + ' (2 PM - 10 PM)' },
    { value: 'night', label: t('night') + ' (8 PM - 6 AM)' }
  ];

  const idProofTypes = [
    { value: 'aadhar', label: t('aadharCard') },
    { value: 'voter', label: t('voterID') },
    { value: 'pan', label: t('panCard') },
    { value: 'driving', label: t('drivingLicense') }
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('staffName')}</FormLabel>
              <FormControl>
                <Input placeholder={t('enterStaffName')} {...field} />
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('category')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {staffCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
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
          name="shiftTiming"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('shiftTiming')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectShift')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {shiftTimings.map((shift) => (
                    <SelectItem key={shift.value} value={shift.value}>
                      {shift.label}
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
          name="salary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('salary')} ({t('optional')})</FormLabel>
              <FormControl>
                <Input placeholder="₹25,000" type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="idProofType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('idProofType')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectIDType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {idProofTypes.map((type) => (
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
          name="idProofNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('idNumber')}</FormLabel>
              <FormControl>
                <Input placeholder={t('enterIDNumber')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergencyContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('emergencyContact')}</FormLabel>
              <FormControl>
                <Input placeholder="+91 XXXXX XXXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('address')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('residentialAddress')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>{t('photo')}</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={handlePhotoCapture}
              className="hidden"
              id="staff-photo"
            />
            <label htmlFor="staff-photo" className="cursor-pointer">
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
          disabled={createStaffMutation.isPending}
        >
          {createStaffMutation.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {t('addStaffMember')}
        </Button>
      </form>
    </Form>
  );
}
