import { useState, useEffect } from "react";
import type { SubmitEvent as ReactSubmitEvent } from "react";
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
  X,
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
  GENDER_OPTIONS,
  RELIGION_OPTIONS,
  LANG_OPTIONS,
  PERSONALITY_TAG_OPTIONS,
  getDropdownOptions,
} from "./config/FilterOption";

import { useUser } from "../context/UserContext";
import { bitescoutApi } from "../services/baseApi";

// const GENDER_OPTIONS = [
//   { label: "Male", value: "male" },
//   { label: "Female", value: "female" },
// ];

// const RELIGION_OPTIONS = [
//   { value: "Islam", label: "Islam" },
//   { value: "Christianity", label: "Christianity" },
//   { value: "Buddhism", label: "Buddhism" },
//   { value: "Hinduism", label: "Hinduism" },
//   { value: "Others", label: "Others" },
// ];

// const LANG_OPTIONS = [
//   { value: "en", label: "English" },
//   { value: "ms", label: "Bahasa Melayu" },
// ];

// const PERSONALITY_TAG_OPTIONS = [
//   "Adventurous eater",
//   "Cafe hopper",
//   "Fine dining lover",
//   "Street food hunter",
//   "Late night foodie",
//   "Healthy eater",
//   "Dessert addict",
// ];

const personalityOptions = PERSONALITY_TAG_OPTIONS.map((tag) => ({
  label: tag,
  value: tag,
}));

export function SignUpFormClient() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, updateUserProfile } = useUser();

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

  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isEditMode && profile) {
      const extendedProfile = profile as any;

      setFullName(profile.displayName ?? "");
      setEmail(profile.email ?? "");
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
  }, [profile, isEditMode]);

  const getValidationErrors = (
    values: {
      fullName: string;
      email: string;
      password?: string;
      gender: string;
      birthday: string;
      religion: string;
      language: string;
      consent?: boolean;
    },
    editMode: boolean = isEditMode,
  ) => {
    const next: Record<string, string> = {};
    if (!values.fullName.trim()) next.fullName = "Full name is required";

    if (!values.email.trim()) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = "Enter a valid email address";
    }

    if (!editMode) {
      if (!values.password) {
        next.password = "Password is required";
      } else if (values.password.length < 8) {
        next.password = "Password must be at least 8 characters";
      }
      if (!values.consent) {
        next.consent = "You must accept the Privacy Policy";
      }
    }

    if (!values.gender) next.gender = "Please select a gender";
    if (!values.birthday) next.birthday = "Birthday is required";
    if (!values.religion) next.religion = "Religion is required";
    if (!values.language) next.language = "Please select a language";

    return next;
  };

  const runValidation = (updatedFields: Record<string, any> = {}) => {
    const currentValues = {
      fullName,
      email,
      password,
      gender,
      birthday,
      religion,
      language,
      consent,
      ...updatedFields,
    };
    const nextErrors = getValidationErrors(currentValues, isEditMode);
    setErrors(nextErrors);
    return nextErrors;
  };

  const handleFieldChange = (
    value: string | boolean,
    setter: (val: any) => void,
    fieldName: string,
  ) => {
    setter(value);
    if (touched[fieldName]) {
      runValidation({ [fieldName]: value });
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    runValidation();
  };

  const handleSubmit = async (e: ReactSubmitEvent) => {
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

    const nextErrors = runValidation();
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);

    if (isEditMode) {
      try {
        // Execute update process directly through context
        await updateUserProfile({
          displayName: fullName,
          avatarUrl: profileImage || undefined,
          gender,
          birthday,
          religion,
          language,
          personalities,
          savedPreferences: preferences,
        });

        setSuccess(true);
        setTimeout(() => navigate("/profile"), 1500);
      } catch (error: any) {
        console.error("Failed to update profile:", error);
        setErrors((prev) => ({
          ...prev,
          apiError: error.message || "Failed to update profile",
        }));
      } finally {
        setIsLoading(false);
      }
      return;
    }
    //   try {
    //     const token = localStorage.getItem("bitescouts_token");
    //     const updateData = {
    //       username: fullName,
    //       profileImage: profileImage,
    //       gender: gender,
    //       birthday: birthday,
    //       religion: religion,
    //       language: language,
    //       preferences: preferences,
    //       personalities: personalities,
    //     };

    //     const response = await fetch(
    //       `http://localhost:8000/user/client/${user?.id}`,
    //       {
    //         method: "PUT",
    //         headers: {
    //           "Content-Type": "application/json",
    //           Authorization: token ? `Bearer ${token}` : "",
    //         },
    //         body: JSON.stringify(updateData),
    //       },
    //     );

    //     if (!response.ok) {
    //       const errData = await response.json();
    //       throw new Error(errData.detail || "Failed to update profile");
    //     }

    //     await updatePreferences(preferences);
    //     setSuccess(true);
    //     setTimeout(() => navigate("/profile"), 1500);
    //   } catch (error: any) {
    //     console.error("Failed to update preferences:", error);
    //     setErrors((prev) => ({
    //       ...prev,
    //       apiError: error.message || "Failed to update profile",
    //     }));
    //   } finally {
    //     setIsLoading(false);
    //   }
    //   return;
    //}

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

    try {
      // const response = await fetch(
      //   "http://localhost:8000/user/client/register",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify(formData),
      //   },
      // );

      // const data = await response.json();

      // if (!response.ok) {
      //   throw new Error(data.detail || "Registration failed");
      // }
      await bitescoutApi.post("/user/client/register", {
        ...formData,
      });

      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (error: any) {
      console.error("API Error:", error);
      setErrors((prev) => ({
        ...prev,
        apiError:
          error.response?.data?.detail ||
          error.message ||
          "Something went wrong",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          form: "Only JPG, PNG, and WEBP image formats are allowed for the profile picture.",
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          form: "Image size should be less than 5MB.",
        }));
        return;
      }

      setErrors((prev) => {
        const { form, ...rest } = prev;
        return rest;
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setProfileImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    setProfileImage(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="flex flex-col items-center gap-3">
        <div className="relative group/container">
          <label htmlFor="profile-upload" className="cursor-pointer group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-bs-gold bg-bs-neutral-100 flex items-center justify-center">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-bs-neutral-400" />
              )}
            </div>

            {!profileImage && (
              <div className="absolute bottom-1 right-1 bg-bs-gold text-white p-2 rounded-full shadow-md group-hover:scale-105 transition">
                <Camera size={16} />
              </div>
            )}
          </label>

          {profileImage && (
            <button
              type="button"
              onClick={handleImageRemove}
              disabled={isLoading}
              className="absolute top-0 right-0 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow-md transition transform hover:scale-110 flex items-center justify-center border-2 border-white"
              title="Remove Profile Picture"
            >
              <X size={12} className="stroke-[3]" />
            </button>
          )}

          <input
            id="profile-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isLoading}
          />
        </div>
        <p className="text-sm text-bs-neutral-500">
          {isEditMode ? "Update Profile Picture" : "Upload Profile Picture"}
        </p>
      </div>

      {(errors.form || errors.apiError) && (
        <div className="p-3 text-sm rounded-lg bg-rose-50 border border-rose-200 text-rose-600">
          {errors.form || errors.apiError}
        </div>
      )}

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
            className="absolute right-3 top-[calc(50%+4px)] -translate-y-1/2 text-bs-neutral-500 hover:text-bs-neutral-700 transition-colors"
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
          options={GENDER_OPTIONS}
          error={touched.gender ? errors.gender : undefined}
          disabled={isLoading}
          icon={<User size={18} />}
          placeholder="Select a gender"
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
          options={RELIGION_OPTIONS}
          error={touched.religion ? errors.religion : undefined}
          disabled={isLoading}
          placeholder="Select a religion"
        />
        <SelectField
          label="Preferred Language"
          value={language}
          onChange={(e) =>
            handleFieldChange(e.target.value, setLanguage, "language")
          }
          onBlur={() => handleBlur("language")}
          options={LANG_OPTIONS}
          error={touched.language ? errors.language : undefined}
          disabled={isLoading}
          placeholder="Select a language"
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

      <p className="text-xs text-bs-neutral-500 -mt-3">
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
          <label className="flex items-start gap-2 text-sm text-bs-neutral-700 cursor-pointer">
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
          <p className="text-xs text-bs-neutral-500">
            By creating an account, you agree to how we process your data.{" "}
            <Link to="/privacy" className="text-bs-gold hover:underline">
              View Privacy Policy
            </Link>
          </p>
          {touched.consent && errors.consent && (
            <p className="text-xs text-bs-red font-medium">{errors.consent}</p>
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
            : "Create Personal Account"}
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
