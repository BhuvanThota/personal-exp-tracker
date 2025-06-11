import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "../components/profile/LoadingSpinner";
import { BackgroundElements } from "../components/profile/BackgroundElements";
import DashboardHeader from "../components/DashboardHeader";
import ThemeToggle from "../components/ThemeToggle";
import { ProfileCard } from "../components/profile/ProfileCard";
import { ProfileForm } from "../components/profile/ProfileForm";
import { GlobalStyles } from "../components/profile/GlobalStyles";
import { showSuccessNotification } from "../utils/notifications";

// TypeScript type for profile
type Profile = {
  id?: string;
  username: string;
  displayName: string;
  phone: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  country: string;
  profilePic: string;
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Profile>({
    username: "",
    displayName: "",
    phone: "",
    dob: "",
    address: "",
    city: "",
    state: "",
    country: "",
    profilePic: "",
  });
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // 10 placeholder profile pic options
  const profilePicOptions = [
    "https://placehold.co/128x128?text=1",
    "https://placehold.co/128x128?text=2",
    "https://placehold.co/128x128?text=3",
    "https://placehold.co/128x128?text=4",
    "https://placehold.co/128x128?text=5",
    "https://placehold.co/128x128?text=6",
    "https://placehold.co/128x128?text=7",
    "https://placehold.co/128x128?text=8",
    "https://placehold.co/128x128?text=9",
    "https://placehold.co/128x128?text=10"
  ];

  useEffect(() => {
    if (session?.user) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          setProfile(data);
          setForm({
            username: data?.username || "",
            displayName: data?.displayName || session?.user?.name || "",
            phone: data?.phone || "",
            dob: data?.dob?.split("T")[0] || "",
            address: data?.address || "",
            city: data?.city || "",
            state: data?.state || "",
            country: data?.country || "",
            profilePic: data?.profilePic || "/default-avatar.png",
          });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'username') {
      setUsernameError(null);
    }
  }

  // Debounced username uniqueness check
  async function onUsernameBlur(e: React.FocusEvent<HTMLInputElement>) {
    const username = e.target.value.trim();
    if (!username) return;
    setCheckingUsername(true);
    try {
      const res = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!data.available && (!profile || profile.username !== username)) {
        setUsernameError("Username taken, try another");
      } else {
        setUsernameError(null);
      }
    } catch {
      setUsernameError("Error checking username");
    } finally {
      setCheckingUsername(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (usernameError) {
      alert("Please choose a unique username.");
      return;
    }
    setSaving(true);
    try {
      const method = profile && profile.id ? "PUT" : "POST";
      const res = await fetch("/api/profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setIsEditing(false);
        showSuccessNotification();
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-all duration-300">
      <BackgroundElements />
      <div className="relative z-10">
        <DashboardHeader />
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            <div className="lg:col-span-1 order-1">
              <ProfileCard form={form} session={session} />
            </div>
            <div className="lg:col-span-2 order-2">
              <ProfileForm
                form={form}
                isEditing={isEditing}
                onChange={handleChange}
                onCancel={() => setIsEditing(false)}
                onSave={handleSubmit}
                saving={saving}
                usernameError={usernameError}
                onUsernameBlur={onUsernameBlur}
                profilePicOptions={profilePicOptions}
                checkingUsername={checkingUsername}
                onEditClick={() => setIsEditing(true)}
              />
            </div>
          </div>
        </div>
      </div>
      <GlobalStyles />
    </div>
  );
}
