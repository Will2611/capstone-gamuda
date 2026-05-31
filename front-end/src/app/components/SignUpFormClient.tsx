import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Phone,
  Camera,
} from "lucide-react";
import { FormField, SelectField } from "./FormField";
import { Button } from "./Button";
// import { SelectField } from "./SelectField";

export function SignUpFormClient() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [religion, setReligion] = useState("");
  const [dietaryNeeds, setDietaryNeeds] = useState<string[]>([]);
  const [language, setLanguage] = useState("");
  const [consent, setConsent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const navigate = useNavigate();

  const [errors, setErrors] = useState<{
    fullName?: string;
    phoneNo?: string;
    email?: string;
    password?: string;
    gender?: string;
    birthday?: string;
    religion?: string;
    language?: string;
    consent?: string;
    form?: string;
  }>({});

  const [touched, setTouched] = useState({
    fullName: false,
    phoneNo: false,
    email: false,
    password: false,
    gender: false,
    birthday: false,
    religion: false,
    language: false,
    consent: false,
  });

  const validate = () => {
    const next: {
      fullName?: string;
      phoneNo?: string;
      email?: string;
      password?: string;
      gender?: string;
      birthday?: string;
      religion?: string;
      language?: string;
      consent?: string;
    } = {};

    if (!fullName.trim()) {
      next.fullName = "Full name is required";
    }

    if (!phoneNo.trim()) {
      next.phoneNo = "Phone number is required";
    } else if (phoneNo.length < 10) {
      next.phoneNo = "Enter a valid phone number";
    }

    if (!email.trim()) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address";
    }

    if (!password) {
      next.password = "Password is required";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters";
    }

    if (!gender) {
      next.gender = "Please select a gender";
    }

    if (!birthday) {
      next.birthday = "Birthday is required";
    }

    if (!religion) {
      next.religion = "Religion is required";
    }

    if (!language) {
      next.language = "Please select a language";
    }

    if (!consent) {
      next.consent = "You must accept the Privacy Policy";
    }
    setErrors(next);

    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const allTouched = {
      fullName: true,
      phoneNo: true,
      email: true,
      password: true,
      gender: true,
      birthday: true,
      religion: true,
      language: true,
      consent: true,
    };

    setTouched(allTouched);

    if (!validate()) return;

    setIsLoading(true);

    const formData = {
      profileImage,
      fullName,
      phoneNo,
      email,
      password,
      gender,
      birthday,
      religion,
      dietaryNeeds,
      language,
      consent,
    };

    console.log("CLIENT REGISTER:", formData);

    setSuccess(true);

    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  const handleChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    field: keyof typeof touched,
  ) => {
    setter(value);

    if (touched[field]) {
      validate();
    }
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((t) => ({ ...t, [field]: true }));
    validate();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  function ErrorText({ message }: { message?: string }) {
    if (!message) return null;

    return <p className="mt-1 text-sm text-bs-red">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
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

            <div className="absolute bottom-1 right-1 bg-bs-gold text-white p-2 rounded-full shadow-md group-hover:scale-105 transition">
              <Camera size={16} />
            </div>
          </label>

          <input
            id="profile-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isLoading}
          />
        </div>

        <p className="text-sm text-bs-neutral-500">Upload Profile Picture</p>
      </div>

      <FormField
        label="Full Name"
        type="text"
        icon={<User size={20} />}
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => handleChange(e.target.value, setFullName, "fullName")}
        onBlur={() => handleBlur("fullName")}
        error={touched.fullName ? errors.fullName : undefined}
        autoComplete="name"
        disabled={isLoading}
      />

      <FormField
        label="Phone Number"
        type="tel"
        icon={<Phone size={20} />}
        placeholder="Phone Number"
        value={phoneNo}
        onChange={(e) => handleChange(e.target.value, setPhoneNo, "phoneNo")}
        onBlur={() => handleBlur("phoneNo")}
        error={touched.phoneNo ? errors.phoneNo : undefined}
        autoComplete="phone"
        disabled={isLoading}
      />

      <FormField
        label="Email"
        type="email"
        icon={<Mail size={20} />}
        placeholder="example@email.com"
        value={email}
        onChange={(e) => handleChange(e.target.value, setEmail, "email")}
        onBlur={() => handleBlur("email")}
        error={touched.email ? errors.email : undefined}
        autoComplete="email"
        disabled={isLoading}
      />

      <div className="relative">
        <FormField
          label="Password"
          type={showPassword ? "text" : "password"}
          icon={<Lock size={20} />}
          placeholder="••••••••"
          value={password}
          onChange={(e) =>
            handleChange(e.target.value, setPassword, "password")
          }
          onBlur={() => handleBlur("password")}
          error={touched.password ? errors.password : undefined}
          autoComplete="new-password"
          className="pr-12"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[calc(50%+5px)] text-bs-neutral-500 pointer-events-none"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <SelectField
        label="Gender"
        value={gender}
        onChange={(e) => handleChange(e.target.value, setGender, "gender")}
        onBlur={() => handleBlur("gender")}
        disabled={isLoading}
        error={touched.gender ? errors.gender : undefined}
        options={genderOptions}
      />

      <FormField
        label="Birthday"
        type="date"
        icon={<Calendar size={20} />}
        value={birthday}
        onChange={(e) => handleChange(e.target.value, setBirthday, "birthday")}
        onBlur={() => handleBlur("birthday")}
        error={touched.birthday ? errors.birthday : undefined}
      />

      <SelectField
        label="Religion"
        value={religion}
        onChange={(e) => handleChange(e.target.value, setReligion, "religion")}
        onBlur={() => handleBlur("religion")}
        disabled={isLoading}
        error={touched.religion ? errors.religion : undefined}
        options={religionOptions}
      />

      <div>
        <label className="block mb-2 font-medium">Dietary Needs</label>
        <div className="flex flex-col gap-2">
          {["Halal", "Vegetarian", "Vegan", "Gluten-Free", "Kosher"].map(
            (item) => (
              <label key={item} className="flex items-center gap-2">
                <input
                  disabled={isLoading}
                  type="checkbox"
                  checked={dietaryNeeds.includes(item)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDietaryNeeds([...dietaryNeeds, item]);
                    } else {
                      setDietaryNeeds(dietaryNeeds.filter((d) => d !== item));
                    }
                  }}
                />
                {item}
              </label>
            ),
          )}
        </div>
      </div>

      <SelectField
        label="Preferred Language"
        value={language}
        onChange={(e) => handleChange(e.target.value, setLanguage, "language")}
        onBlur={() => handleBlur("language")}
        disabled={isLoading}
        error={touched.language ? errors.language : undefined}
        options={langOptions}
      />

      <div className="space-y-2">
        <label className="flex items-start gap-2 text-sm text-bs-neutral-700">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
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
        <ErrorText message={touched.consent ? errors.consent : undefined} />
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-green-100 border border-green-300 text-green-700 text-sm">
          Account created successfully! Redirecting to login...
        </div>
      )}
      {errors.form && (
        <div className="p-3 rounded-lg bg-bs-red/10 border border-bs-red/30 text-sm text-bs-red">
          {errors.form}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Registering..." : "Create Client Account"}
      </Button>
      <p className="text-center text-sm text-bs-neutral-600">
        Already have an account?{" "}
        <Link to="/login" className="text-bs-gold font-medium hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
