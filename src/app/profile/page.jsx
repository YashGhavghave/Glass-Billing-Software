import { PublicLayout } from '@/components/layout/public-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth-session';
import { redirect } from 'next/navigation';
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <PublicLayout>
      <section className="py-12 sm:py-16">
        <div className="container px-4 md:px-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Profile Settings</CardTitle>
              <CardDescription>Customize your profile and personal preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
