export type Settings = {
  business_name: string;
  phone: string;
  whatsapp: string;
  address: string;
  hours: string;
  maps_url: string;
  instagram: string;
  facebook: string;
  store_image: string;
};
export type PublicData = {
  settings: Settings;
  services: string[];
  times: string[];
};
export async function api(path: string, method = "GET", body?: unknown) {
  const res = await fetch("/api" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Please try again.");
  return data;
}
export const emptySettings: Settings = {
  business_name: "Sri Lucky Eye Wear & Clinic",
  phone: "",
  whatsapp: "",
  address: "",
  hours: "",
  maps_url: "",
  instagram: "",
  facebook: "",
  store_image: "",
};
export const services = [
  "Eye Examination",
  "Vision Testing",
  "Consultation",
  "Contact Lens Consultation",
  "Spectacle Fitting",
];
export const times = [
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];
