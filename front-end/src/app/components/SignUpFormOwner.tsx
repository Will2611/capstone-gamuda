import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Clock,
  Camera,
  Phone,
  Link as LinkIcon,
} from "lucide-react";

import { FormField, SelectField } from "./FormField";
import { Button } from "./Button";

const priceRangeOptions = [
  { value: "", label: "Any Price" },
  { value: "1", label: "$ < RM20 / person" },
  { value: "2", label: "$$ RM20 - RM60 / person" },
  { value: "3", label: "$$$ RM60 - RM110 / person" },
  { value: "4", label: "$$$$ RM110 - RM250 / person" },
  { value: "5", label: "$$$$$ > RM250 / person" },
];

export function SignUpFormOwner() {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [restaurantImages, setRestaurantImages] = useState<string[]>([]);
  const [restaurantURL, setRestaurantURL] = useState("");
  const [cuisineType, setCuisineType] = useState<string[]>([]);
  const [ambience, setAmbience] = useState<string[]>([]);
  const [dietaryNeeds, setDietaryNeeds] = useState<string[]>([]);
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [closedDays, setClosedDays] = useState<string[]>([]);
  const [street, setStreet] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const fetchCoordinatesFromAddress = async () => {
    if (!street.trim() || !postcode.trim() || !city.trim()) return;

    setIsSearchingLocation(true);
    try {
      let cleanStreet1 = street
        .replace(/no\.?\s*\d+[-–\/]*\d*\w*/gi, "") // remove eg: No. 12, No 12-A
        .replace(/lot\.?\s*\d+/gi, "") // remove eg: Lot 123
        .replace(/block\s*\w+/gi, "") // remove eg: Block A
        .replace(/flat\s*\w+/gi, "") // remove eg: Flat B
        .replace(/level\s*\d+/gi, "") // remove eg: Level 3
        .replace(/floor\s*\d+/gi, "") // remove eg: 3rd Floor
        .replace(/[\s,]+/g, " ") // remove comma ,
        .trim();

      if (!cleanStreet1) cleanStreet1 = street.trim();

      console.log("Address after removing the house number:", cleanStreet1);

      let params = new URLSearchParams({
        format: "json",
        street: cleanStreet1,
        postalcode: postcode.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim() || "Malaysia",
        limit: "1",
      });

      let response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      );
      let data = await response.json();

      if (data && data.length > 0) {
        setLatitude(parseFloat(data[0].lat));
        setLongitude(parseFloat(data[0].lon));
        return;
      }

      let cleanStreet2 = "";
      if (cleanStreet1.includes(",")) {
        cleanStreet2 = cleanStreet1
          .split(",")
          .map((p) => p.trim())
          .filter((p) => !p.toLowerCase().includes("jalan") && p.length > 0)
          .join(", ");
      }

      if (!cleanStreet2) {
        cleanStreet2 = cleanStreet1
          .replace(/jalan\s+[^\s,]+/gi, "")
          .replace(/[\s,]+/g, " ")
          .trim();
      }

      if (cleanStreet2 && cleanStreet2 !== cleanStreet1) {
        console.log("Address after removing the house street:", cleanStreet2);

        let tamanParams = new URLSearchParams({
          format: "json",
          street: cleanStreet2,
          postalcode: postcode.trim(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim() || "Malaysia",
          limit: "1",
        });

        let fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?${tamanParams.toString()}`,
        );
        let fallbackData = await fallbackResponse.json();

        if (fallbackData && fallbackData.length > 0) {
          setLatitude(parseFloat(fallbackData[0].lat));
          setLongitude(parseFloat(fallbackData[0].lon));
          return;
        }
      }

      console.error("Location not found. ");
      setLatitude(null);
      setLongitude(null);
    } catch (error) {
      console.error("Geocoding Error:", error);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCoordinatesFromAddress();
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [street, postcode, city, state, country]);

  const [errors, setErrors] = useState<{
    ownerName?: string;
    email?: string;
    password?: string;
    restaurantName?: string;
    contactNo?: string;
    restaurantURL?: string;
    cuisineType?: string;
    priceRange?: string;
    ambience?: string;
    openTime?: string;
    closeTime?: string;
    street?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    consent?: string;
    form?: string;
  }>({});

  const [touched, setTouched] = useState({
    ownerName: false,
    email: false,
    password: false,
    restaurantName: false,
    contactNo: false,
    restaurantURL: false,
    cuisineType: false,
    priceRange: false,
    ambience: false,
    openTime: false,
    closeTime: false,
    street: false,
    postcode: false,
    city: false,
    state: false,
    country: false,
    consent: false,
  });

  const validate = () => {
    const next: typeof errors = {};

    if (!ownerName.trim()) next.ownerName = "Owner name is required";

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

    if (!restaurantName.trim())
      next.restaurantName = "Restaurant name is required";

    if (restaurantURL.trim()) {
      try {
        const parsedUrl = new URL(restaurantURL);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          next.restaurantURL = "URL must start with http:// or https://";
        }
      } catch (err) {
        next.restaurantURL = "Enter a valid website URL";
      }
    }

    if (!contactNo.trim()) {
      next.contactNo = "Restaurant contact number is required";
    } else if (contactNo.length < 10) {
      next.contactNo = "Enter a valid contact number";
    }

    if (cuisineType.length === 0)
      next.cuisineType = "Please select at least one cuisine type";
    if (!priceRange) next.priceRange = "Please select a price range";
    if (ambience.length === 0)
      next.ambience = "Please select at least one restaurant ambience";

    if (!openTime) next.openTime = "Opening time is required";
    if (!closeTime) next.closeTime = "Closing time is required";

    if (!street.trim()) next.street = "Street is required";
    if (!postcode.trim()) next.postcode = "Postcode is required";
    if (!city.trim()) next.city = "City is required";
    if (!state.trim()) next.state = "State is required";
    if (!country.trim()) next.country = "Country is required";
    if (!consent) next.consent = "You must accept the Privacy Policy";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const allTouched = {
      ownerName: true,
      email: true,
      password: true,
      restaurantName: true,
      contactNo: true,
      restaurantURL: true,
      cuisineType: true,
      priceRange: true,
      ambience: true,
      openTime: true,
      closeTime: true,
      street: true,
      postcode: true,
      city: true,
      state: true,
      country: true,
      consent: true,
    };

    setTouched(allTouched);
    if (!validate()) return;

    setIsLoading(true);

    const formData = {
      profileImage,
      ownerName,
      email,
      password,
      restaurantName,
      contactNo,
      restaurantImages,
      restaurantURL,
      cuisineType,
      priceRange,
      ambience,
      dietaryNeeds,
      operatingHours: `${openTime} - ${closeTime}`,
      closedDays,
      address: {
        street,
        postcode,
        city,
        state,
        country,
        coordinates: latitude && longitude ? { latitude, longitude } : null,
      },
      country,
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
      setTimeout(() => validate(), 0);
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
          className="absolute right-3 top-[calc(50%+5px)] text-bs-neutral-500 hover:text-bs-neutral-700"
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

      <FormField
        label="Restaurant Contact Number"
        type="tel"
        icon={<Phone size={20} />}
        placeholder="Restaurant Contact Number"
        value={contactNo}
        onChange={(e) =>
          handleChange(e.target.value, setContactNo, "contactNo")
        }
        onBlur={() => handleBlur("contactNo")}
        error={touched.contactNo ? errors.contactNo : undefined}
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

      <FormField
        label="Restaurant Website URL"
        type="text"
        icon={<LinkIcon size={20} />}
        placeholder="Restaurant URL"
        value={restaurantURL}
        onChange={(e) =>
          handleChange(e.target.value, setRestaurantURL, "restaurantURL")
        }
        onBlur={() => handleBlur("restaurantURL")}
        error={touched.restaurantURL ? errors.restaurantURL : undefined}
        disabled={isLoading}
      />

      {/* Cuisine Types */}
      <div className="space-y-2">
        <label className="block font-medium">
          Cuisine Types (Select all that apply)
        </label>
        <div className="grid grid-cols-2 gap-2 bg-bs-neutral-50 p-3 rounded-lg border">
          {[
            "Japanese",
            "Korean",
            "Western",
            "Chinese",
            "Malay",
            "Indian",
            "Fusion",
            "Italian",
            "Mexican",
            "Asian",
            "American",
            "Mediteranean",
          ].map((item) => (
            <label
              key={item}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={cuisineType.includes(item)}
                disabled={isLoading}
                onBlur={() => handleBlur("cuisineType")}
                onChange={(e) => {
                  let updated: string[];
                  if (e.target.checked) {
                    updated = [...cuisineType, item];
                  } else {
                    updated = cuisineType.filter((c) => c !== item);
                  }
                  setCuisineType(updated);
                  if (touched.cuisineType) setTimeout(() => validate(), 0);
                }}
              />
              {item}
            </label>
          ))}
        </div>
        {touched.cuisineType && errors.cuisineType && (
          <p className="text-sm text-bs-red">{errors.cuisineType}</p>
        )}
      </div>

      {/* Price Range */}
      <SelectField
        label="Price Range"
        value={priceRange}
        onChange={(e) =>
          handleChange(e.target.value, setPriceRange, "priceRange")
        }
        onBlur={() => handleBlur("priceRange")}
        disabled={isLoading}
        error={touched.priceRange ? errors.priceRange : undefined}
        options={priceRangeOptions}
      />

      <div className="space-y-2">
        <label className="block font-medium">
          Restaurant Ambience (Select all that apply)
        </label>
        <div className="grid grid-cols-2 gap-2 bg-bs-neutral-50 p-3 rounded-lg border">
          {[
            "Casual",
            "Fine Dining",
            "Romantic",
            "Family",
            "Business",
            "Trendy",
            "Quiet",
            "Cozy",
            "Lively",
          ].map((item) => (
            <label
              key={item}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={ambience.includes(item)}
                disabled={isLoading}
                onBlur={() => handleBlur("ambience")}
                onChange={(e) => {
                  let updated: string[];
                  if (e.target.checked) {
                    updated = [...ambience, item];
                  } else {
                    updated = ambience.filter((a) => a !== item);
                  }
                  setAmbience(updated);
                  if (touched.ambience) setTimeout(() => validate(), 0);
                }}
              />
              {item}
            </label>
          ))}
        </div>
        {touched.ambience && errors.ambience && (
          <p className="text-sm text-bs-red">{errors.ambience}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block font-medium">Supported Dietary Needs</label>
        <div className="grid grid-cols-2 gap-2 bg-bs-neutral-50 p-3 rounded-lg border">
          {["Halal", "Vegetarian", "Vegan", "Gluten-Free", "Kosher"].map(
            (item) => (
              <label
                key={item}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
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

      <br />
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Default Operating Hours
        </label>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Opening Time"
            type="time"
            icon={<Clock size={20} />}
            value={openTime}
            onChange={(e) =>
              handleChange(e.target.value, setOpenTime, "openTime")
            }
            onBlur={() => handleBlur("openTime")}
            error={touched.openTime ? errors.openTime : undefined}
            disabled={isLoading}
          />
          <FormField
            label="Closing Time"
            type="time"
            icon={<Clock size={20} />}
            value={closeTime}
            onChange={(e) =>
              handleChange(e.target.value, setCloseTime, "closeTime")
            }
            onBlur={() => handleBlur("closeTime")}
            error={touched.closeTime ? errors.closeTime : undefined}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-medium">Closed Days</label>
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
            <label
              key={day}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={closedDays.includes(day)}
                disabled={isLoading}
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

      <br />
      <div className="space-y-4">
        <label className="block text-sm font-medium text-bs-neutral-800">
          Restaurant Location
        </label>

        <FormField
          label="Street Address"
          type="text"
          placeholder="eg. No. ..., Jalan..."
          value={street}
          onChange={(e) => handleChange(e.target.value, setStreet, "street")}
          onBlur={() => handleBlur("street")}
          error={touched.street ? errors.street : undefined}
          disabled={isLoading}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Postcode"
            type="text"
            placeholder="eg. 00000"
            value={postcode}
            onChange={(e) =>
              handleChange(e.target.value, setPostcode, "postcode")
            }
            onBlur={() => handleBlur("postcode")}
            error={touched.postcode ? errors.postcode : undefined}
            disabled={isLoading}
          />
          <FormField
            label="City"
            type="text"
            placeholder="eg. Kuala Lumpur"
            value={city}
            onChange={(e) => handleChange(e.target.value, setCity, "city")}
            onBlur={() => handleBlur("city")}
            error={touched.city ? errors.city : undefined}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="State"
            type="text"
            placeholder="eg. Wilayah Persekutuan"
            value={state}
            onChange={(e) => handleChange(e.target.value, setState, "state")}
            onBlur={() => handleBlur("state")}
            error={touched.state ? errors.state : undefined}
            disabled={isLoading}
          />
          <FormField
            label="Country"
            type="text"
            placeholder="eg. Malaysia"
            value={country}
            onChange={(e) =>
              handleChange(e.target.value, setCountry, "country")
            }
            onBlur={() => handleBlur("country")}
            error={touched.country ? errors.country : undefined}
            disabled={isLoading}
          />
        </div>

        {(isSearchingLocation || (latitude && longitude)) && (
          <div className="mt-4 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-bs-neutral-500">
                Map Preview
              </span>
              {isSearchingLocation ? (
                <span className="text-xs text-bs-gold animate-pulse">
                  Locating on map...
                </span>
              ) : (
                <span className="text-xs text-green-600 font-medium">
                  ✓ Location Found
                </span>
              )}
            </div>

            <div className="w-full h-48 rounded-lg overflow-hidden border border-bs-neutral-200 bg-bs-neutral-50 flex items-center justify-center relative">
              {latitude && longitude ? (
                <iframe
                  title="Restaurant Location Map"
                  width="100%"
                  height="100%"
                  className="border-0"
                  src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                />
              ) : (
                <div className="text-xs text-bs-neutral-400 animate-pulse">
                  Loading map framework...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-2 text-sm text-bs-neutral-700 cursor-pointer">
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
