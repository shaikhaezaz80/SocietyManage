import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAmenityBookingSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Loader2, Clock, Users, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n";
import { z } from "zod";

const bookingFormSchema = insertAmenityBookingSchema.omit({ 
  societyId: true, 
  bookedBy: true, 
  flatId: true 
});

interface AmenityBookingProps {
  onSuccess?: () => void;
}

export default function AmenityBooking({ onSuccess }: AmenityBookingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedAmenity, setSelectedAmenity] = useState<any>(null);

  const { data: amenities, isLoading: amenitiesLoading } = useQuery({
    queryKey: ["/api/amenities"]
  });

  const { data: myBookings } = useQuery({
    queryKey: ["/api/amenity-bookings"]
  });

  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      amenityId: 0,
      bookingDate: new Date(),
      startTime: new Date(),
      endTime: new Date(),
      amount: "0",
      purpose: "",
      guestCount: 0,
      specialRequests: ""
    }
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bookingFormSchema>) => {
      const bookingData = {
        ...data,
        flatId: 1, // This should be derived from user data
        amount: selectedAmenity?.hourlyRate || selectedAmenity?.dailyRate || 0
      };

      const res = await apiRequest("POST", "/api/amenity-bookings", bookingData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/amenity-bookings"] });
      toast({
        title: t('success'),
        description: t('bookingCreated'),
      });
      form.reset();
      setSelectedAmenity(null);
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

  const onSubmit = (data: z.infer<typeof bookingFormSchema>) => {
    createBookingMutation.mutate(data);
  };

  const handleAmenitySelect = (amenityId: string) => {
    const amenity = amenities?.find((a: any) => a.id === parseInt(amenityId));
    setSelectedAmenity(amenity);
    form.setValue('amenityId', parseInt(amenityId));
  };

  const timeSlots = [
    { value: '06:00', label: '6:00 AM' },
    { value: '07:00', label: '7:00 AM' },
    { value: '08:00', label: '8:00 AM' },
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '17:00', label: '5:00 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '20:00', label: '8:00 PM' },
    { value: '21:00', label: '9:00 PM' },
    { value: '22:00', label: '10:00 PM' }
  ];

  // Mock amenities data
  const mockAmenities = [
    {
      id: 1,
      name: 'Swimming Pool',
      description: 'Olympic size swimming pool with changing rooms',
      hourlyRate: 200,
      capacity: 50,
      availableHours: '6:00 AM - 10:00 PM'
    },
    {
      id: 2,
      name: 'Community Hall',
      description: 'Large hall perfect for events and celebrations',
      dailyRate: 1500,
      capacity: 100,
      availableHours: '24/7 (with advance booking)'
    },
    {
      id: 3,
      name: 'Gym',
      description: 'Fully equipped gym with modern equipment',
      hourlyRate: 100,
      capacity: 20,
      availableHours: '5:00 AM - 11:00 PM'
    },
    {
      id: 4,
      name: 'Tennis Court',
      description: 'Professional tennis court with floodlights',
      hourlyRate: 300,
      capacity: 4,
      availableHours: '6:00 AM - 10:00 PM'
    }
  ];

  const displayAmenities = amenities || mockAmenities;

  // Mock bookings data
  const mockBookings = [
    {
      id: 1,
      amenityName: 'Swimming Pool',
      bookingDate: new Date(),
      startTime: '18:00',
      endTime: '19:00',
      status: 'confirmed',
      amount: 200
    },
    {
      id: 2,
      amenityName: 'Community Hall',
      bookingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: '10:00',
      endTime: '22:00',
      status: 'confirmed',
      amount: 1500
    }
  ];

  const displayBookings = myBookings || mockBookings;

  if (amenitiesLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loadingAmenities')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Amenities */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('availableAmenities')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayAmenities.map((amenity: any) => (
            <Card key={amenity.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {amenity.name.includes('Pool') ? '🏊' : 
                     amenity.name.includes('Hall') ? '🏛️' :
                     amenity.name.includes('Gym') ? '💪' :
                     amenity.name.includes('Tennis') ? '🎾' : '🏢'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{amenity.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{amenity.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{amenity.capacity} people</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{amenity.availableHours}</span>
                      </span>
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary">
                        {amenity.hourlyRate ? `₹${amenity.hourlyRate}/hour` : `₹${amenity.dailyRate}/day`}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('bookAmenity')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amenityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('selectAmenity')}</FormLabel>
                    <Select onValueChange={handleAmenitySelect}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('chooseAmenity')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {displayAmenities.map((amenity: any) => (
                          <SelectItem key={amenity.id} value={amenity.id.toString()}>
                            {amenity.name} - {amenity.hourlyRate ? `₹${amenity.hourlyRate}/hr` : `₹${amenity.dailyRate}/day`}
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
                name="bookingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('bookingDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t('pickDate')}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('startTime')}</FormLabel>
                      <Select onValueChange={(value) => {
                        const [hours, minutes] = value.split(':');
                        const date = new Date();
                        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                        field.onChange(date);
                      }}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectTime')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
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
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('endTime')}</FormLabel>
                      <Select onValueChange={(value) => {
                        const [hours, minutes] = value.split(':');
                        const date = new Date();
                        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                        field.onChange(date);
                      }}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectTime')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="guestCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('guestCount')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
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
                    <FormLabel>{t('purpose')} ({t('optional')})</FormLabel>
                    <FormControl>
                      <Input placeholder={t('purposePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('specialRequests')} ({t('optional')})</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('specialRequestsPlaceholder')} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedAmenity && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">{t('bookingSummary')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t('amenity')}:</span>
                      <span>{selectedAmenity.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('rate')}:</span>
                      <span>
                        {selectedAmenity.hourlyRate ? `₹${selectedAmenity.hourlyRate}/hour` : `₹${selectedAmenity.dailyRate}/day`}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>{t('totalAmount')}:</span>
                      <span>₹{selectedAmenity.hourlyRate || selectedAmenity.dailyRate}</span>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-blue-500 hover:bg-blue-600"
                disabled={createBookingMutation.isPending}
              >
                {createBookingMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {t('bookNow')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* My Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('myBookings')}</CardTitle>
        </CardHeader>
        <CardContent>
          {displayBookings.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t('noBookings')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayBookings.map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{booking.amenityName}</h4>
                    <div className="text-sm text-gray-600">
                      <p>{format(new Date(booking.bookingDate), 'PPP')}</p>
                      <p>{booking.startTime} - {booking.endTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {t(booking.status)}
                    </Badge>
                    <p className="text-sm font-medium mt-1">₹{booking.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
