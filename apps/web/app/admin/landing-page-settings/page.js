import LandingPageSettingsLayout from '@/components/admin/settings/LandingPageSettingsLayout';
import AdminLayout from '@/components/layout/AdminLayout';

export const metadata = {
  title: 'Landing Page Settings | Admin',
  description: 'Manage landing page sections and settings',
};

export default function LandingPageSettingsPage() {
  return (
    <AdminLayout noPadding>
      <LandingPageSettingsLayout />
    </AdminLayout>
  );
}
