import { useState, type FormEvent, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Camera,
  Utensils,
  DollarSign,
  Leaf,
  MapPin,
  Coffee,
  Clock,
  Smile,
} from "lucide-react";
import { FormField, SelectField } from "./FormField";
import { MultiSelectField } from "./MultiSelectField";
import { Button } from "./Button";
import type { SearchPreferences } from "../types/restaurant";
import {
  CUISINE_OPTIONS,
  PRICE_OPTIONS,
  DIETARY_OPTIONS,
  DISTANCE_OPTIONS,
  AMBIENCE_OPTIONS,
  TIME_OPTIONS,
  getDropdownOptions,
} from "./config/FilterOption";

import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";

export function SignUpFormClient() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, updatePreferences } = useUser();
  const { user } = useAuth();

  const isEditMode = searchParams.get("mode") === "edit";

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [religion, setReligion] = useState("");
  const [language, setLanguage] = useState("");
  const [consent, setConsent] = useState(false);
  const [personalities, setPersonalities] = useState<string[]>([]);

  const [preferences, setPreferences] = useState<SearchPreferences>({
    cuisine: [],
    priceRange: [],
    dietary: [],
    distance: "",
    ambience: [],
    time: "",
  });

  useEffect(() => {
    if (isEditMode && profile) {
      const extendedProfile = profile as any;

      setFullName(user?.displayName ?? profile.displayName ?? "");
      setEmail(user?.email ?? profile.email ?? "");
      setProfileImage(profile.avatarUrl ?? null);

      if (extendedProfile.gender) setGender(extendedProfile.gender);
      if (extendedProfile.birthday) setBirthday(extendedProfile.birthday);
      if (extendedProfile.religion) setReligion(extendedProfile.religion);
      if (extendedProfile.language) setLanguage(extendedProfile.language);
      if (extendedProfile.personalities)
        setPersonalities(extendedProfile.personalities);

      if (profile.savedPreferences) {
        setPreferences({
          cuisine: profile.savedPreferences.cuisine || [],
          priceRange: profile.savedPreferences.priceRange || [],
          dietary: profile.savedPreferences.dietary || [],
          distance: profile.savedPreferences.distance || "",
          ambience: profile.savedPreferences.ambience || [],
          time: profile.savedPreferences.time || "",
        });
      }
    }
  }, [profile, user, isEditMode]);

  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const genderOptions = [
    { label: "Select Gender", value: "" },
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ];
  const religionOptions = [
    { value: "", label: "Select Religion" },
    { value: "Islam", label: "Islam" },
    { value: "Christianity", label: "Christianity" },
    { value: "Buddhism", label: "Buddhism" },
    { value: "Hinduism", label: "Hinduism" },
    { value: "Others", label: "Others" },
  ];
  const langOptions = [
    { value: "", label: "Select Language" },
    { value: "en", label: "English" },
    { value: "ms", label: "Bahasa Melayu" },
  ];

  const PERSONALITY_TAG_OPTIONS = [
    "Adventurous eater",
    "Cafe hopper",
    "Fine dining lover",
    "Street food hunter",
    "Late night foodie",
    "Healthy eater",
    "Dessert addict",
  ];

  const personalityOptions = PERSONALITY_TAG_OPTIONS.map((tag) => ({
    label: tag,
    value: tag,
  }));

  const getValidationErrors = (
    currentValues: {
      fullName: string;
      email: string;
      password: string;
      gender: string;
      birthday: string;
      religion: string;
      language: string;
      consent: boolean;
    },
    editMode: boolean = isEditMode,
  ) => {
    const next: Record<string, string> = {};
    if (!currentValues.fullName.trim()) next.fullName = "Full name is required";
    if (!currentValues.email.trim()) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentValues.email)) {
      next.email = "Enter a valid email address";
    }

    if (!editMode) {
      if (!currentValues.password) {
        next.password = "Password is required";
      } else if (currentValues.password.length < 8) {
        next.password = "Password must be at least 8 characters";
      }
    }

    if (!currentValues.gender) next.gender = "Please select a gender";
    if (!currentValues.birthday) next.birthday = "Birthday is required";
    if (!currentValues.religion) next.religion = "Religion is required";
    if (!currentValues.language) next.language = "Please select a language";

    if (!editMode && !currentValues.consent) {
      next.consent = "You must accept the Privacy Policy";
    }
    return next;
  };

  const handleFieldChange = (
    value: string | boolean,
    setter: (val: any) => void,
    fieldName: string,
  ) => {
    setter(value);

    if (touched[fieldName]) {
      const updatedValues = {
        fullName,
        email,
        password,
        gender,
        birthday,
        religion,
        language,
        consent,
        [fieldName]: value,
      };
      const nextErrors = getValidationErrors(updatedValues, isEditMode);
      setErrors(nextErrors);
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const nextErrors = getValidationErrors(
      {
        fullName,
        email,
        password,
        gender,
        birthday,
        religion,
        language,
        consent,
      },
      isEditMode,
    );
    setErrors(nextErrors);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const allTouched = {
      fullName: true,
      email: true,
      password: !isEditMode,
      gender: true,
      birthday: true,
      religion: true,
      language: true,
      consent: !isEditMode,
    };
    setTouched(allTouched);

    const nextErrors = getValidationErrors(
      {
        fullName,
        email,
        password,
        gender,
        birthday,
        religion,
        language,
        consent,
      },
      isEditMode,
    );
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;
    setIsLoading(true);

    //edit mode
    if (isEditMode) {
      try {
        await updatePreferences(preferences);

        // await updateFullProfile({
        //   fullName,
        //   gender,
        //   birthday,
        //   religion,
        //   language,
        //   personalities,
        //   avatarUrl: profileImage
        // });

        setSuccess(true);
        setTimeout(() => navigate("/profile"), 1500);
      } catch (error) {
        console.error("Failed to update preferences:", error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    //new user
    const formData = {
      profileImage,
      fullName,
      email,
      password,
      gender,
      birthday,
      religion,
      language,
      consent,
      preferences,
      personalities,
    };
    console.log("CLIENT REGISTER:", formData);
    setSuccess(true);
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <label htmlFor="profile-upload" className="cursor-pointer group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-bs-gold bg-bs-neutral-100 flex items-center justify-center">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-bs-neutral-400" />
              )}
            </div>
            <div className="absolute bottom-1 right-1 bg-bs-gold text-white p-2 rounded-full shadow-md">
              <Camera size={16} />
            </div>
          </label>
          <input
            id="profile-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] &&
              setProfileImage(URL.createObjectURL(e.target.files[0]))
            }
            disabled={isLoading}
          />
        </div>
        <p className="text-sm text-bs-neutral-500">
          {isEditMode ? "Update Profile Picture" : "Upload Profile Picture"}
        </p>
      </div>

      <FormField
        label="Full Name"
        type="text"
        icon={<User size={20} />}
        value={fullName}
        onChange={(e) =>
          handleFieldChange(e.target.value, setFullName, "fullName")
        }
        onBlur={() => handleBlur("fullName")}
        error={touched.fullName ? errors.fullName : undefined}
        disabled={isLoading}
        placeholder="Full Name"
      />
      <FormField
        label="Email"
        type="email"
        icon={<Mail size={20} />}
        value={email}
        onChange={(e) => handleFieldChange(e.target.value, setEmail, "email")}
        onBlur={() => handleBlur("email")}
        error={touched.email ? errors.email : undefined}
        disabled={isLoading || isEditMode}
        placeholder="example@email.com"
      />

      {!isEditMode && (
        <div className="relative">
          <FormField
            label="Password"
            type={showPassword ? "text" : "password"}
            icon={<Lock size={20} />}
            value={password}
            onChange={(e) =>
              handleFieldChange(e.target.value, setPassword, "password")
            }
            onBlur={() => handleBlur("password")}
            error={touched.password ? errors.password : undefined}
            className="pr-12"
            disabled={isLoading}
            placeholder="********"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[42px] text-bs-neutral-500"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Gender"
          value={gender}
          onChange={(e) =>
            handleFieldChange(e.target.value, setGender, "gender")
          }
          onBlur={() => handleBlur("gender")}
          options={genderOptions}
          error={touched.gender ? errors.gender : undefined}
          disabled={isLoading}
          icon={<User size={18} />}
        />
        <FormField
          label="Birthday"
          type="date"
          icon={<Calendar size={20} />}
          value={birthday}
          onChange={(e) =>
            handleFieldChange(e.target.value, setBirthday, "birthday")
          }
          onBlur={() => handleBlur("birthday")}
          error={touched.birthday ? errors.birthday : undefined}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Religion"
          value={religion}
          onChange={(e) =>
            handleFieldChange(e.target.value, setReligion, "religion")
          }
          onBlur={() => handleBlur("religion")}
          options={religionOptions}
          error={touched.religion ? errors.religion : undefined}
          disabled={isLoading}
        />
        <SelectField
          label="Preferred Language"
          value={language}
          onChange={(e) =>
            handleFieldChange(e.target.value, setLanguage, "language")
          }
          onBlur={() => handleBlur("language")}
          options={langOptions}
          error={touched.language ? errors.language : undefined}
          disabled={isLoading}
        />
      </div>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-bs-neutral-200"></div>
        </div>
        <div className="relative flex justify-start">
          <span className="bg-white pr-3 text-base font-semibold text-bs-neutral-800">
            {isEditMode
              ? "Your Dining Preferences"
              : "Initial Dining Preferences"}
          </span>
        </div>
      </div>
      <p className="text-xs text-bs-neutral-500 -mt-2">
        Help us customize your BiteScouts recommendation feed immediately.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MultiSelectField
          label="Cuisine Preference"
          value={preferences.cuisine}
          onChange={(val) => setPreferences((p) => ({ ...p, cuisine: val }))}
          options={CUISINE_OPTIONS}
          disabled={isLoading}
          icon={<Utensils size={18} />}
          placeholder="Any Cuisine"
        />
        <MultiSelectField
          label="Budget Tier"
          value={preferences.priceRange}
          onChange={(val) => setPreferences((p) => ({ ...p, priceRange: val }))}
          options={PRICE_OPTIONS}
          disabled={isLoading}
          icon={<DollarSign size={18} />}
          placeholder="Any Price"
        />
        <MultiSelectField
          label="Dietary Requirements"
          value={preferences.dietary}
          onChange={(val) => setPreferences((p) => ({ ...p, dietary: val }))}
          options={DIETARY_OPTIONS}
          disabled={isLoading}
          icon={<Leaf size={18} />}
          placeholder="No Restrictions"
        />
        <MultiSelectField
          label="Vibe / Ambience"
          value={preferences.ambience}
          onChange={(val) => setPreferences((p) => ({ ...p, ambience: val }))}
          options={AMBIENCE_OPTIONS}
          disabled={isLoading}
          icon={<Coffee size={18} />}
          placeholder="Any Vibe"
        />
        <SelectField
          label="Ideal Distance"
          value={preferences.distance}
          onChange={(e) =>
            setPreferences((p) => ({ ...p, distance: e.target.value }))
          }
          options={getDropdownOptions("Any Distance", DISTANCE_OPTIONS)}
          disabled={isLoading}
          icon={<MapPin size={18} />}
        />
        <SelectField
          label="Preferred Dining Time"
          value={preferences.time}
          onChange={(e) =>
            setPreferences((p) => ({ ...p, time: e.target.value }))
          }
          options={getDropdownOptions("Any Time", TIME_OPTIONS)}
          disabled={isLoading}
          icon={<Clock size={18} />}
        />
        <MultiSelectField
          label="Food Personality"
          value={personalities}
          onChange={(val) => setPersonalities(val)}
          options={personalityOptions}
          disabled={isLoading}
          icon={<Smile size={18} />}
          placeholder="Select your food vibe"
        />
      </div>

      {!isEditMode && (
        <div className="space-y-2 pt-2">
          <label className="flex items-start gap-2 text-sm text-bs-neutral-700">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) =>
                handleFieldChange(e.target.checked, setConsent, "consent")
              }
              className="mt-1"
              disabled={isLoading}
            />
            <span>I agree to the Privacy Policy and Terms of Service</span>
          </label>
          {touched.consent && errors.consent && (
            <p className="text-xs text-bs-red">{errors.consent}</p>
          )}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-green-100 border border-green-300 text-green-700 text-sm">
          {isEditMode
            ? "Preferences updated successfully! Returning to profile..."
            : "Account created successfully! Redirecting to login..."}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading
          ? isEditMode
            ? "Saving Changes..."
            : "Registering..."
          : isEditMode
            ? "Save Preferences"
            : "Create Client Account"}
      </Button>

      {!isEditMode && (
        <p className="text-center text-sm text-bs-neutral-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-bs-gold font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      )}
    </form>
  );
}
