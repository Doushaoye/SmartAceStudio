'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useI18n } from '@/context/i18n-context';
import type { ReactNode } from 'react';
import { useState } from 'react';

type UnlockFormProps = {
  children: ReactNode;
  onUnlock: (data: { name: string; phone: string }) => void;
};

export function UnlockForm({ children, onUnlock }: UnlockFormProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const formSchema = z.object({
    name: z.string().min(1, t('errors.required')),
    phone: z.string().regex(/^1[3-9]\d{9}$/, t('errors.invalidPhone')),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onUnlock(values);
    setOpen(false); // Close the dialog on successful submission
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('result.unlockForm.title')}</DialogTitle>
          <DialogDescription>{t('result.unlockForm.description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('result.unlockForm.nameLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('result.unlockForm.namePlaceholder')} {...field} />
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
                  <FormLabel>{t('result.unlockForm.phoneLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('result.unlockForm.phonePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{t('result.unlockForm.submitButton')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
