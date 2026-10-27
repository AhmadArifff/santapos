import LoginPageSettingsLayout from '@/components/admin/settings/LoginPageSettingsLayout';
import AdminLayout from '@/components/layout/AdminLayout';

export const metadata = {
  title: 'Login Page Settings | Admin',
  description: 'Manage login page text and images',
};

export default function LoginPageSettingsPage() {
  return (
    <AdminLayout noPadding>
      <LoginPageSettingsLayout />
    </AdminLayout>
  );
}
