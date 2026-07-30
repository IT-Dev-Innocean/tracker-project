import { useState, useEffect } from 'react';
import { DialogRoot, DialogContent } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { userApi } from '@/api';

export default function SettingsDialog() {
  const { isSettingsOpen, closeSettings, showToast } = useUIStore();
  const { profile, init } = useAuthStore();
  const [form, setForm] = useState({ full_name: '', email: '', current_password: '', new_password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name || '', email: profile.email || '', current_password: '', new_password: '' });
    }
  }, [profile, isSettingsOpen]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { full_name: form.full_name, email: form.email };
      if (form.new_password) {
        payload.current_password = form.current_password;
        payload.new_password = form.new_password;
      }
      await userApi.updateProfile(payload);
      await init();
      showToast('Profile updated!', 'success');
      closeSettings();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogRoot open={isSettingsOpen} onOpenChange={(o) => !o && closeSettings()}>
      <DialogContent title="Settings" className="max-w-md">
        <div className="space-y-3 mt-2">
          <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <hr className="border-cu-border" />
          <div><Label>Current Password</Label><Input type="password" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} /></div>
          <div><Label>New Password</Label><Input type="password" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeSettings}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
