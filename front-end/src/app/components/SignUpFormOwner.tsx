import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Clock,
  MapPin,
  Camera,
  Phone,
} from "lucide-react";

import { FormField } from "./FormField";
import { Button } from "./Button";
import { SelectField } from "./SelectField";

export function SignUpFormOwner() {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [ownerName, setOwnerName] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantImages, setRestaurantImages] = useState<string[]>([]);
  const [cuisineType, setCuisineType] = useState("");
  const [dietaryNeeds, setDietaryNeeds] = useState<string[]>([]);
  const [operatingHours, setOperatingHours] = useState("");
  const [closedDays, setClosedDays] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [consent, setConsent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const [errors, setErrors] = useState<{
    ownerName?: string;
    phoneNo?: string;
    email?: string;
    password?: string;
    restaurantName?: string;
    cuisineType?: string;
    operatingHours?: string;
    location?: string;
    consent?: string;
    form?: string;
  }>({});

  const [touched, setTouched] = useState({
    ownerName: false,
    phoneNo: false,
    email: false,
    password: false,
    restaurantName: false,
    cuisineType: false,
    operatingHours: false,
    location: false,
    consent: false,
  });

  const validate = () => {
    const next: typeof errors = {};

    if (!ownerName.trim()) {
      next.ownerName = "Owner name is required";
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

    if (!restaurantName.trim()) {
      next.restaurantName = "Restaurant name is required";
    }

    if (!cuisineType) {
      next.cuisineType = "Please select cuisine type";
    }

    if (!operatingHours.trim()) {
      next.operatingHours = "Operating hours are required";
    }

    if (!location.trim()) {
      next.location = "Location is required";
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
      ownerName: true,
      phoneNo: true,
      email: true,
      password: true,
      restaurantName: true,
      cuisineType: true,
      operatingHours: true,
      location: true,
      consent: true,
    };

    setTouched(allTouched);

    if (!validate()) return;

    setIsLoading(true);

    const formData = {
      profileImage,
      phoneNo,
      ownerName,
      email,
      password,
      restaurantName,
      cuisineType,
      dietaryNeeds,
      operatingHours,
      closedDays,
      location,
      consent,
    };

    console.log("OWNER REGISTER:", formData);

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

  const handleRestaurantImagesUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);

    const imageUrls = files.map((file) => URL.createObjectURL(file));

    setRestaurantImages((prev) => [...prev, ...imageUrls]);
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

      {errors.form && (
        <div className="p-3 rounded-lg bg-bs-red/10 border border-bs-red/30 text-sm text-bs-red">
          {errors.form}
        </div>
      )}

      <FormField
        label="Owner Name"
        type="text"
        icon={<User size={20} />}
        placeholder="Owner Name"
        value={ownerName}
        onChange={(e) =>
          handleChange(e.target.value, setOwnerName, "ownerName")
        }
        onBlur={() => handleBlur("ownerName")}
        error={touched.ownerName ? errors.ownerName : undefined}
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
        disabled={isLoading}
      />

      <FormField
        label="Email"
        type="email"
        icon={<Mail size={20} />}
        placeholder="restaurant@example.com"
        value={email}
        onChange={(e) => handleChange(e.target.value, setEmail, "email")}
        onBlur={() => handleBlur("email")}
        error={touched.email ? errors.email : undefined}
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
          className="pr-12"
          disabled={isLoading}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-bs-neutral-500 hover:text-bs-neutral-700"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <br />
      <hr />
      <br />

      <FormField
        label="Restaurant Name"
        type="text"
        icon={<User size={20} />}
        placeholder="Restaurant Name"
        value={restaurantName}
        onChange={(e) =>
          handleChange(e.target.value, setRestaurantName, "restaurantName")
        }
        onBlur={() => handleBlur("restaurantName")}
        error={touched.restaurantName ? errors.restaurantName : undefined}
        disabled={isLoading}
      />

      <div className="space-y-3">
        <label className="block text-sm font-medium">Restaurant Images</label>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleRestaurantImagesUpload}
          disabled={isLoading}
        />

        <div className="grid grid-cols-3 gap-3">
          {restaurantImages.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Restaurant ${index}`}
              className="w-full h-24 object-cover rounded-lg border"
            />
          ))}
        </div>
      </div>

      <SelectField
        label="Cuisine Type"
        value={cuisineType}
        onChange={(e) =>
          handleChange(e.target.value, setCuisineType, "cuisineType")
        }
        onBlur={() => handleBlur("cuisineType")}
        disabled={isLoading}
        error={touched.cuisineType ? errors.cuisineType : undefined}
      >
        <option value="">Select Cuisine Type</option>
        <option value="Japanese">Japanese</option>
        <option value="Korean">Korean</option>
        <option value="Cafe">Cafe</option>
        <option value="Western">Western</option>
        <option value="Chinese">Chinese</option>
        <option value="Malay">Malay</option>
        <option value="Indian">Indian</option>
      </SelectField>

      <div>
        <label className="block mb-2 font-medium">
          Supported Dietary Needs
        </label>

        <div className="flex flex-col gap-2">
          {["Halal", "Vegetarian", "Vegan", "Gluten-Free", "Kosher"].map(
            (item) => (
              <label key={item} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={dietaryNeeds.includes(item)}
                  disabled={isLoading}
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

      <div className="space-y-4">
        <FormField
          label="Default Operating Hours"
          type="text"
          icon={<Clock size={20} />}
          placeholder="10AM - 10PM"
          value={operatingHours}
          onChange={(e) =>
            handleChange(e.target.value, setOperatingHours, "operatingHours")
          }
          onBlur={() => handleBlur("operatingHours")}
          error={touched.operatingHours ? errors.operatingHours : undefined}
          disabled={isLoading}
        />

        <div>
          <label className="block mb-2 font-medium">Closed Days</label>

          <div className="flex flex-wrap gap-3">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <label key={day} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={closedDays.includes(day)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setClosedDays([...closedDays, day]);
                    } else {
                      setClosedDays(closedDays.filter((d) => d !== day));
                    }
                  }}
                />

                {day}
              </label>
            ))}
          </div>
        </div>
      </div>

      <FormField
        label="Restaurant Location"
        type="text"
        icon={<MapPin size={20} />}
        placeholder="Restaurant Location"
        value={location}
        onChange={(e) => handleChange(e.target.value, setLocation, "location")}
        onBlur={() => handleBlur("location")}
        error={touched.location ? errors.location : undefined}
        disabled={isLoading}
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

        {touched.consent && errors.consent && (
          <p className="text-sm text-bs-red">{errors.consent}</p>
        )}
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-green-100 border border-green-300 text-green-700 text-sm">
          Account created successfully! Redirecting to login...
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Create Restaurant Account"}
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
