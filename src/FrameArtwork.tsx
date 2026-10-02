// Traced in the hero photograph's coordinates: shared by the photo mask,
// original-pixel extraction and crisp material pass. The silhouette never changes.
export const rim =
  "M895 301 C927 285 974 276 1007 282 Q1029 289 1042 286 Q1058 285 1073 271 C1108 245 1161 230 1204 230 Q1212 230 1212 241 C1214 279 1202 318 1184 334 C1164 350 1130 358 1109 354 C1080 350 1065 329 1058 313 Q1049 299 1040 303 Q1035 306 1035 317 C1032 345 1025 364 1011 374 C984 391 950 391 929 381 C910 367 898 334 895 301 Z M919 313 C940 295 982 286 1012 292 Q1028 297 1028 310 C1029 334 1021 355 1010 367 C991 378 964 383 946 377 C926 369 915 343 916 328 Q916 319 919 313 Z M1070 291 C1085 270 1135 253 1161 249 C1179 246 1188 250 1189 263 C1193 287 1184 315 1174 330 C1156 345 1128 351 1110 347 C1087 343 1073 323 1070 307 Q1067 299 1070 291 Z";
export const temple =
  "M1209 233 L1215 236 L1215 242 L1254 258 L1259 268 L1254 267 L1211 248 Z";
export const lenses =
  "M919 313 C940 295 982 286 1012 292 Q1028 297 1028 310 C1029 334 1021 355 1010 367 C991 378 964 383 946 377 C926 369 915 343 916 328 Q916 319 919 313 Z M1070 291 C1085 270 1135 253 1161 249 C1179 246 1188 250 1189 263 C1193 287 1184 315 1174 330 C1156 345 1128 351 1110 347 C1087 343 1073 323 1070 307 Q1067 299 1070 291 Z";

export function HeroPortrait() {
  return (
    <svg
      className="hero-portrait"
      viewBox="0 0 1586 992"
      width="1586"
      height="992"
      role="img"
      aria-label="Woman wearing black cat-eye glasses, the inspiration for our eyewear journey"
    >
      <defs>
        <filter id="repair-feather">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <mask
          id="hero-rim-removal"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1586"
          height="992"
        >
          <rect width="1586" height="992" fill="white" />
          <path
            className="photo-repair-mask"
            d="M880 292 C962 261 1005 263 1037 271 C1092 237 1165 209 1219 218 L1280 279 L1274 295 L1220 272 C1218 340 1170 376 1109 371 Q1064 366 1046 334 C1024 395 967 410 926 395 C898 378 887 335 880 292 Z"
            fill="black"
            filter="url(#repair-feather)"
          />
        </mask>
      </defs>
      <image
        href="/hero-clean.webp"
        width="1586"
        height="992"
        preserveAspectRatio="none"
      />
      <image
        href="/hero-portrait.webp"
        width="1586"
        height="992"
        mask="url(#hero-rim-removal)"
      />
    </svg>
  );
}

export default function FrameArtwork() {
  return (
    <svg
      className="frame-artwork"
      viewBox="880 220 405 180"
      width="405"
      height="180"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="original-rim-clip">
          <path d={rim} clipRule="evenodd" />
          <path d={temple} />
        </clipPath>
        <clipPath id="lens-clip">
          <path d={lenses} />
        </clipPath>
        <linearGradient id="acetate" x1="0" y1="0" x2="0.25" y2="1">
          <stop stopColor="#292d30" />
          <stop offset=".16" stopColor="#090c0f" />
          <stop offset=".65" stopColor="#111417" />
          <stop offset="1" stopColor="#31363a" />
        </linearGradient>
        <linearGradient id="rim-light" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#777f87" />
          <stop offset=".35" stopColor="#252a30" />
          <stop offset=".7" stopColor="#8695a3" />
          <stop offset="1" stopColor="#252b31" />
        </linearGradient>
        <linearGradient id="blue-glass" x1="0" y1="0" x2=".7" y2="1">
          <stop stopColor="#b3d8ef" stopOpacity=".7" />
          <stop offset=".38" stopColor="#6796b9" stopOpacity=".13" />
          <stop offset=".65" stopColor="#a3cde9" stopOpacity=".3" />
          <stop offset="1" stopColor="#436f95" stopOpacity=".55" />
        </linearGradient>
        <linearGradient id="glass-streak">
          <stop stopColor="white" stopOpacity="0" />
          <stop offset=".5" stopColor="#deeffb" stopOpacity=".9" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="original-rims">
        <image
          href="/hero-portrait.webp"
          x="0"
          y="0"
          width="1586"
          height="992"
          clipPath="url(#original-rim-clip)"
        />
      </g>
      <g className="detail-rims">
        <path
          d={temple}
          fill="url(#acetate)"
          stroke="url(#rim-light)"
          strokeWidth=".65"
        />
        <path
          d={rim}
          fill="url(#acetate)"
          fillRule="evenodd"
          stroke="url(#rim-light)"
          strokeWidth=".7"
        />
        <path
          d="M899 300 C943 284 986 279 1007 284 M1066 270 C1107 244 1161 232 1205 234 M932 380 C957 387 988 375 1008 364 M1085 339 C1115 351 1157 341 1177 327"
          clipPath="url(#original-rim-clip)"
          fill="none"
          stroke="#aab5be"
          strokeOpacity=".55"
          strokeWidth=".65"
        />
      </g>
      <g className="lens-reflection" clipPath="url(#lens-clip)">
        <path d={lenses} fill="url(#blue-glass)" />
        <path
          className="lens-streak"
          d="M890 300 L1240 237 L1243 250 L893 313 Z"
          fill="url(#glass-streak)"
        />
        <path
          d={lenses}
          fill="none"
          stroke="#9dc8e2"
          strokeOpacity=".35"
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}
