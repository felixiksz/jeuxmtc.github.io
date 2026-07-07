/* Service worker — Connections MTC offline cache */
const MTC_OFFLINE_VERSION = "20260707-offline-v13-acu-associations";
const MTC_CACHE_NAME = "connections-mtc-" + MTC_OFFLINE_VERSION;
const CORE_ASSETS = [
  "./",
  "00-study-domain-launcher.js",
  "01-00-recherche-rendu-compact.js",
  "02-01-point-details-data.js",
  "03-02-raw-data.js",
  "04-03-core-game.js",
  "05-04-final-corrections.js",
  "06-05-stats-total-real-points.js",
  "07-06-search-normalization.js",
  "08-07-stats-v2.js",
  "09-08-search-intersections-style.js",
  "10-08-extraordinary-vessels-search.js",
  "11-09-intersections-search-mode.js",
  "12-10-fullscreen-links.js",
  "13-11-point-links-final-fix.js",
  "14-12-comparison-az.js",
  "15-13-comparison-ab-search-noauto.js",
  "16-14-comparison-all-fields.js",
  "17-15-no-auto-open-from-basket.js",
  "18-16-true-slot-message.js",
  "19-17-mobile-blooddrop-support.js",
  "20-18-cheatsheet-8-vessels.js",
  "21-19-stats-time-filter.js",
  "22-20-pharma-data.js",
  "23-21-pharma-game-v1.js",
  "24-22-pharma-herb-panel.js",
  "25-23-pharma-cheatsheet-essentielles.js",
  "26-24-pharma-tools.js",
  "27-25-pharma-stats-gameplay.js",
  "28-26-acu-image-synthese-stats.js",
  "28-26-bucket8-acu-export-import-fixes.js",
  "29-27-visible-gameplay-mode-switch.js",
  "30-comparison-redesign.css",
  "30-comparison-redesign.js",
  "31-search-compare-select.css",
  "31-search-compare-select.js",
  "32-audio-pronunciation.js",
  "33-stable-hotfix.css",
  "33-stable-hotfix.js",
  "34-targeted-requests.css",
  "34-targeted-requests.js",
  "37-fixed-detail-close-zone.css",
  "38-tutorial-user-texts.js",
  "39-mobile-game-audio-fix.js",
  "40-comparison-loading-history.css",
  "40-comparison-loading-history.js",
  "41-force-comparison-history-fix.js",
  "42-pharma-mobile-esprit-history.js",
  "44-simple-replay-history-mobile.css",
  "44-simple-replay-history-mobile.js",
  "45-baskerville-esprit-replay.css",
  "45-baskerville-esprit-replay.js",
  "46-memo-mode.css",
  "46-memo-mode.js",
  "47-acu-image-import-novelty.js",
  "48-offline-pwa.css",
  "48-offline-pwa.js",
  "Import_tableau pharma_pro(1).json",
  "README_HORS_CONNEXION.txt",
  "README_PUBLICATION.txt",
  "audio-manifest.js",
  "bucket8-acu-export-import-fixes.css",
  "icon-192.png",
  "icon-512.png",
  "index.html",
  "manifest.webmanifest",
  "modele_import_donnees_locales_pharma_etendu.json",
  "mtc-styles.css",
  "pharma-cheatsheet-essentielles.css",
  "pharma-game-v1.css",
  "study-domain-launcher.css",
  "sw.js"
];
const AUDIO_ASSETS = [
  "audio/%23U4e09%23U4e03_baidu_zh.mp3",
  "audio/%23U4e09%23U5546_google_zh-CN.mp3",
  "audio/%23U4e09%23U68f1_baidu_zh.mp3",
  "audio/%23U4e09%23U7126%23U4fde_baidu_zh.mp3",
  "audio/%23U4e09%23U89d2%23U7078_baidu_zh.mp3",
  "audio/%23U4e09%23U95f4_baidu_zh.mp3",
  "audio/%23U4e09%23U9634%23U4ea4_baidu_zh.mp3",
  "audio/%23U4e0a%23U5de8%23U865a_baidu_zh.mp3",
  "audio/%23U4e0a%23U5ec9_baidu_zh.mp3",
  "audio/%23U4e0a%23U661f_baidu_zh.mp3",
  "audio/%23U4e0a%23U8118_baidu_zh.mp3",
  "audio/%23U4e0b%23U5173_baidu_zh.mp3",
  "audio/%23U4e0b%23U5de8%23U865a_baidu_zh.mp3",
  "audio/%23U4e18%23U589f_baidu_zh.mp3",
  "audio/%23U4e2d%23U51b2_baidu_zh.mp3",
  "audio/%23U4e2d%23U5c01_baidu_zh.mp3",
  "audio/%23U4e2d%23U5e9c_baidu_zh.mp3",
  "audio/%23U4e2d%23U6781_baidu_zh.mp3",
  "audio/%23U4e2d%23U6cc9_google_zh-CN.mp3",
  "audio/%23U4e2d%23U6e1a_baidu_zh.mp3",
  "audio/%23U4e2d%23U8118_baidu_zh.mp3",
  "audio/%23U4e2d%23U8182%23U4fde_baidu_zh.mp3",
  "audio/%23U4e2d%23U90fd_baidu_zh.mp3",
  "audio/%23U4e2d%23U9b41_google_zh-CN.mp3",
  "audio/%23U4e30%23U9686_baidu_zh.mp3",
  "audio/%23U4e39%23U53c2_baidu_zh.mp3",
  "audio/%23U4e4c%23U6885_baidu_zh.mp3",
  "audio/%23U4e73%23U6839_baidu_zh.mp3",
  "audio/%23U4e73%23U9999_baidu_zh.mp3",
  "audio/%23U4e8c%23U95f4_baidu_zh.mp3",
  "audio/%23U4e91%23U95e8_baidu_zh.mp3",
  "audio/%23U4e94%23U52a0%23U76ae_baidu_zh.mp3",
  "audio/%23U4e94%23U5473%23U5b50_baidu_zh.mp3",
  "audio/%23U4ea4%23U4fe1_baidu_zh.mp3",
  "audio/%23U4eac%23U5927%23U621f_baidu_zh.mp3",
  "audio/%23U4eac%23U95e8_baidu_zh.mp3",
  "audio/%23U4eac%23U9aa8_baidu_zh.mp3",
  "audio/%23U4eba%23U4e2d_baidu_zh.mp3",
  "audio/%23U4eba%23U53c2_baidu_zh.mp3",
  "audio/%23U4eba%23U8fce_baidu_zh.mp3",
  "audio/%23U4ec6%23U53c2_baidu_zh.mp3",
  "audio/%23U4ed9%23U9e64%23U8349_baidu_zh.mp3",
  "audio/%23U4f1a%23U5b97_baidu_zh.mp3",
  "audio/%23U4f1a%23U9634_baidu_zh.mp3",
  "audio/%23U4f55%23U9996%23U4e4c_baidu_zh.mp3",
  "audio/%23U4f5b%23U624b_baidu_zh.mp3",
  "audio/%23U4fa0%23U6eaa_baidu_zh.mp3",
  "audio/%23U4fa0%23U767d_baidu_zh.mp3",
  "audio/%23U4fa7%23U67cf%23U53f6_baidu_zh.mp3",
  "audio/%23U504f%23U5386_baidu_zh.mp3",
  "audio/%23U5149%23U660e_baidu_zh.mp3",
  "audio/%23U515a%23U53c2_baidu_zh.mp3",
  "audio/%23U5168%23U874e_baidu_zh.mp3",
  "audio/%23U516b%23U90aa_google_zh-CN.mp3",
  "audio/%23U516c%23U5b59_baidu_zh.mp3",
  "audio/%23U5173%23U5143%23U4fde_baidu_zh.mp3",
  "audio/%23U5173%23U5143_baidu_zh.mp3",
  "audio/%23U5173%23U51b2_baidu_zh.mp3",
  "audio/%23U517b%23U8001_baidu_zh.mp3",
  "audio/%23U5185%23U5173_baidu_zh.mp3",
  "audio/%23U5185%23U5ead_baidu_zh.mp3",
  "audio/%23U5185%23U8e1d%23U5c16_baidu_zh.mp3",
  "audio/%23U51ac%23U866b%23U590f%23U8349_baidu_zh.mp3",
  "audio/%23U51b0%23U7247_baidu_zh.mp3",
  "audio/%23U51b2%23U9633_baidu_zh.mp3",
  "audio/%23U51b3%23U660e%23U5b50_baidu_zh.mp3",
  "audio/%23U51e4%23U773c_google_zh-CN.mp3",
  "audio/%23U5206_google_zh-CN.mp3",
  "audio/%23U5217%23U7f3a_baidu_zh.mp3",
  "audio/%23U523a%23U84ba%23U85dc_baidu_zh.mp3",
  "audio/%23U524d%23U8c37_baidu_zh.mp3",
  "audio/%23U52b3%23U5bab_baidu_zh.mp3",
  "audio/%23U5317%23U6c99%23U53c2_baidu_zh.mp3",
  "audio/%23U5341%23U5ba3_google_zh-CN.mp3",
  "audio/%23U5347%23U9ebb_baidu_zh.mp3",
  "audio/%23U534a%23U590f_baidu_zh.mp3",
  "audio/%23U5357%23U6c99%23U53c2_baidu_zh.mp3",
  "audio/%23U5370%23U5802_google_zh-CN.mp3",
  "audio/%23U5389%23U5151_baidu_zh.mp3",
  "audio/%23U539a%23U6734_baidu_zh.mp3",
  "audio/%23U53a5%23U9634%23U4fde_baidu_zh.mp3",
  "audio/%23U5408%23U6b22%23U76ae_baidu_zh.mp3",
  "audio/%23U5408%23U8c37_baidu_zh.mp3",
  "audio/%23U540e%23U6eaa_baidu_zh.mp3",
  "audio/%23U542c%23U4f1a_google_zh-CN.mp3",
  "audio/%23U542c%23U5bab_google_zh-CN.mp3",
  "audio/%23U5434%23U8331%23U8438_baidu_zh.mp3",
  "audio/%23U547d%23U95e8_baidu_zh.mp3",
  "audio/%23U54d1%23U95e8_baidu_zh.mp3",
  "audio/%23U5546%23U4e18_baidu_zh.mp3",
  "audio/%23U5546%23U9633_baidu_zh.mp3",
  "audio/%23U56db%23U767d_baidu_zh.mp3",
  "audio/%23U56db%23U795e%23U806a_google_zh-CN.mp3",
  "audio/%23U56db%23U7f1d_google_zh-CN.mp3",
  "audio/%23U5730%23U4e94%23U4f1a_baidu_zh.mp3",
  "audio/%23U5730%23U4ed3_baidu_zh.mp3",
  "audio/%23U5730%23U673a_baidu_zh.mp3",
  "audio/%23U5730%23U6986_baidu_zh.mp3",
  "audio/%23U5730%23U795e_google_zh-CN.mp3",
  "audio/%23U5730%23U9aa8%23U76ae_baidu_zh.mp3",
  "audio/%23U5730%23U9f99_baidu_zh.mp3",
  "audio/%23U590d%23U6e9c_baidu_zh.mp3",
  "audio/%23U590f%23U67af%23U8349_baidu_zh.mp3",
  "audio/%23U5916%23U4e18_baidu_zh.mp3",
  "audio/%23U5916%23U5173_baidu_zh.mp3",
  "audio/%23U5916%23U52b3%23U5bab_google_zh-CN.mp3",
  "audio/%23U5916%23U8e1d%23U5c16_baidu_zh.mp3",
  "audio/%23U5927%23U5305_baidu_zh.mp3",
  "audio/%23U5927%23U62c7%23U6307%23U5934_google_zh-CN.mp3",
  "audio/%23U5927%23U6307%23U8282%23U6a2a%23U7eb9_google_zh-CN.mp3",
  "audio/%23U5927%23U6566_baidu_zh.mp3",
  "audio/%23U5927%23U677c_baidu_zh.mp3",
  "audio/%23U5927%23U67a3_baidu_zh.mp3",
  "audio/%23U5927%23U690e_baidu_zh.mp3",
  "audio/%23U5927%23U6a2a_baidu_zh.mp3",
  "audio/%23U5927%23U80a0%23U4fde_baidu_zh.mp3",
  "audio/%23U5927%23U90fd_baidu_zh.mp3",
  "audio/%23U5927%23U949f_baidu_zh.mp3",
  "audio/%23U5927%23U9675_baidu_zh.mp3",
  "audio/%23U5927%23U9aa8%23U7a7a_google_zh-CN.mp3",
  "audio/%23U5927%23U9ec4_baidu_zh.mp3",
  "audio/%23U5929%23U4e95_baidu_zh.mp3",
  "audio/%23U5929%23U5357%23U661f_baidu_zh.mp3",
  "audio/%23U5929%23U5bb9_baidu_zh.mp3",
  "audio/%23U5929%23U5e9c_baidu_zh.mp3",
  "audio/%23U5929%23U67a2_baidu_zh.mp3",
  "audio/%23U5929%23U67f1_google_zh-CN.mp3",
  "audio/%23U5929%23U6c60_baidu_zh.mp3",
  "audio/%23U5929%23U7256_baidu_zh.mp3",
  "audio/%23U5929%23U7a81_baidu_zh.mp3",
  "audio/%23U5929%23U7a97%23U7a74_baidu_zh.mp3",
  "audio/%23U5929%23U7a97_baidu_zh.mp3",
  "audio/%23U5929%23U7afa%23U9ec4_baidu_zh.mp3",
  "audio/%23U5929%23U82b1%23U7c89_baidu_zh.mp3",
  "audio/%23U5929%23U9ace_baidu_zh.mp3",
  "audio/%23U5929%23U9ebb_baidu_zh.mp3",
  "audio/%23U592a%23U4e59_baidu_zh.mp3",
  "audio/%23U592a%23U51b2_baidu_zh.mp3",
  "audio/%23U592a%23U5b50%23U53c2_baidu_zh.mp3",
  "audio/%23U592a%23U6e0a_baidu_zh.mp3",
  "audio/%23U592a%23U6eaa_baidu_zh.mp3",
  "audio/%23U592a%23U767d_baidu_zh.mp3",
  "audio/%23U592a%23U9633_baidu_zh.mp3",
  "audio/%23U5934%23U7ef4_google_zh-CN.mp3",
  "audio/%23U5973%23U8d1e%23U5b50_baidu_zh.mp3",
  "audio/%23U59d4%23U4e2d_baidu_zh.mp3",
  "audio/%23U59d4%23U9633_baidu_zh.mp3",
  "audio/%23U59dc%23U9ec4_baidu_zh.mp3",
  "audio/%23U5b54%23U6700_baidu_zh.mp3",
  "audio/%23U5b89%23U7720_google_zh-CN.mp3",
  "audio/%23U5c04%23U5e72_baidu_zh.mp3",
  "audio/%23U5c0f%23U6d77_baidu_zh.mp3",
  "audio/%23U5c0f%23U80a0%23U4fde_baidu_zh.mp3",
  "audio/%23U5c0f%23U8334%23U9999_baidu_zh.mp3",
  "audio/%23U5c0f%23U84df_baidu_zh.mp3",
  "audio/%23U5c0f%23U9aa8%23U7a7a_google_zh-CN.mp3",
  "audio/%23U5c11%23U51b2_baidu_zh.mp3",
  "audio/%23U5c11%23U5546_baidu_zh.mp3",
  "audio/%23U5c11%23U5e9c_baidu_zh.mp3",
  "audio/%23U5c11%23U6cfd_baidu_zh.mp3",
  "audio/%23U5c11%23U6d77_baidu_zh.mp3",
  "audio/%23U5c3a%23U6cfd_baidu_zh.mp3",
  "audio/%23U5c71%23U6942_baidu_zh.mp3",
  "audio/%23U5c71%23U8331%23U8438_baidu_zh.mp3",
  "audio/%23U5c71%23U836f_baidu_zh.mp3",
  "audio/%23U5ddd%23U695d%23U5b50_baidu_zh.mp3",
  "audio/%23U5ddd%23U828e_baidu_zh.mp3",
  "audio/%23U5ddd%23U8d1d%23U6bcd_baidu_zh.mp3",
  "audio/%23U5de8%23U9619_baidu_zh.mp3",
  "audio/%23U5de8%23U9aa8_baidu_zh.mp3",
  "audio/%23U5de8%23U9ace_baidu_zh.mp3",
  "audio/%23U5df4%23U8c46_baidu_zh.mp3",
  "audio/%23U5e26%23U8109_baidu_zh.mp3",
  "audio/%23U5e72%23U59dc_baidu_zh.mp3",
  "audio/%23U5e7f%23U85ff%23U9999_baidu_zh.mp3",
  "audio/%23U5ef6%23U80e1%23U7d22_baidu_zh.mp3",
  "audio/%23U5f52%23U6765_baidu_zh.mp3",
  "audio/%23U5f53%23U5f52_baidu_zh.mp3",
  "audio/%23U5f53%23U9633_google_zh-CN.mp3",
  "audio/%23U5fc3%23U4fde_baidu_zh.mp3",
  "audio/%23U60ac%23U949f_baidu_zh.mp3",
  "audio/%23U624b%23U4e09%23U91cc_baidu_zh.mp3",
  "audio/%23U624b%23U5927%23U6307%23U7532%23U540e_google_zh-CN.mp3",
  "audio/%23U624b%23U592a%23U9633_baidu_zh.mp3",
  "audio/%23U624b%23U9006%23U6ce8_baidu_zh.mp3",
  "audio/%23U6276%23U7a81_baidu_zh.mp3",
  "audio/%23U627f%23U6d46_baidu_zh.mp3",
  "audio/%23U652f%23U6b63_baidu_zh.mp3",
  "audio/%23U652f%23U6c9f_baidu_zh.mp3",
  "audio/%23U65cb%23U8986%23U82b1_baidu_zh.mp3",
  "audio/%23U65e5%23U6708_baidu_zh.mp3",
  "audio/%23U6606%23U4ed1_baidu_zh.mp3",
  "audio/%23U6606%23U5e03_baidu_zh.mp3",
  "audio/%23U66f2%23U6c60_baidu_zh.mp3",
  "audio/%23U66f2%23U6cc9_baidu_zh.mp3",
  "audio/%23U66f2%23U6cfd_baidu_zh.mp3",
  "audio/%23U66f2%23U9aa8_baidu_zh.mp3",
  "audio/%23U671f%23U95e8_baidu_zh.mp3",
  "audio/%23U6728%23U74dc_baidu_zh.mp3",
  "audio/%23U6728%23U901a_baidu_zh.mp3",
  "audio/%23U6728%23U9999_baidu_zh.mp3",
  "audio/%23U675c%23U4ef2_baidu_zh.mp3",
  "audio/%23U675f%23U9aa8_baidu_zh.mp3",
  "audio/%23U6761%23U53e3_baidu_zh.mp3",
  "audio/%23U677f%23U84dd%23U6839_baidu_zh.mp3",
  "audio/%23U677f%23U95e8_google_zh-CN.mp3",
  "audio/%23U67b3%23U5b9e_baidu_zh.mp3",
  "audio/%23U67b8%23U675e%23U5b50_baidu_zh.mp3",
  "audio/%23U67cf%23U5b50%23U4ec1_baidu_zh.mp3",
  "audio/%23U67f4%23U80e1_baidu_zh.mp3",
  "audio/%23U67ff%23U8482_baidu_zh.mp3",
  "audio/%23U6800%23U5b50_baidu_zh.mp3",
  "audio/%23U6838%23U6843%23U4ec1_baidu_zh.mp3",
  "audio/%23U6842%23U679d_baidu_zh.mp3",
  "audio/%23U6843%23U4ec1_baidu_zh.mp3",
  "audio/%23U6851%23U53f6_baidu_zh.mp3",
  "audio/%23U6851%23U5bc4%23U751f_baidu_zh.mp3",
  "audio/%23U6851%23U679d_baidu_zh.mp3",
  "audio/%23U6851%23U87b5%23U86f8_baidu_zh.mp3",
  "audio/%23U6854%23U6897_baidu_zh.mp3",
  "audio/%23U6881%23U4e18_baidu_zh.mp3",
  "audio/%23U6881%23U95e8_baidu_zh.mp3",
  "audio/%23U6c14%23U51b2_baidu_zh.mp3",
  "audio/%23U6c14%23U6d77%23U4fde_baidu_zh.mp3",
  "audio/%23U6c14%23U6d77_baidu_zh.mp3",
  "audio/%23U6c14%23U820d_baidu_zh.mp3",
  "audio/%23U6c34%23U5206_baidu_zh.mp3",
  "audio/%23U6c34%23U6cc9_baidu_zh.mp3",
  "audio/%23U6ca1%23U836f_baidu_zh.mp3",
  "audio/%23U6cfd%23U6cfb_baidu_zh.mp3",
  "audio/%23U6d59%23U8d1d%23U6bcd_baidu_zh.mp3",
  "audio/%23U6d77%23U87b5%23U86f8_baidu_zh.mp3",
  "audio/%23U6d8c%23U6cc9_baidu_zh.mp3",
  "audio/%23U6db2%23U95e8_baidu_zh.mp3",
  "audio/%23U6deb%23U7f8a%23U85ff_baidu_zh.mp3",
  "audio/%23U6e29%23U6e9c_baidu_zh.mp3",
  "audio/%23U6ed1%23U77f3_baidu_zh.mp3",
  "audio/%23U706b%23U9ebb%23U4ec1_baidu_zh.mp3",
  "audio/%23U7075%23U829d_baidu_zh.mp3",
  "audio/%23U7075%23U9053_baidu_zh.mp3",
  "audio/%23U70ae%23U59dc_baidu_zh.mp3",
  "audio/%23U7136%23U8c37_baidu_zh.mp3",
  "audio/%23U7167%23U6d77_baidu_zh.mp3",
  "audio/%23U719f%23U5730%23U9ec4_baidu_zh.mp3",
  "audio/%23U7259%23U75db_google_zh-CN.mp3",
  "audio/%23U725b%23U819d_baidu_zh.mp3",
  "audio/%23U725b%23U84a1%23U5b50_baidu_zh.mp3",
  "audio/%23U7261%23U4e39%23U76ae_baidu_zh.mp3",
  "audio/%23U7261%23U86ce_baidu_zh.mp3",
  "audio/%23U728a%23U9f3b_baidu_zh.mp3",
  "audio/%23U72ec%23U6d3b_baidu_zh.mp3",
  "audio/%23U72ec%23U9634_baidu_zh.mp3",
  "audio/%23U732a%23U82d3_baidu_zh.mp3",
  "audio/%23U7384%23U53c2_baidu_zh.mp3",
  "audio/%23U7387%23U8c37_google_zh-CN.mp3",
  "audio/%23U7389%23U7af9_baidu_zh.mp3",
  "audio/%23U73af%23U8df3_baidu_zh.mp3",
  "audio/%23U73cd%23U73e0%23U6bcd_baidu_zh.mp3",
  "audio/%23U73cd%23U73e0_baidu_zh.mp3",
  "audio/%23U74dc%23U8482_baidu_zh.mp3",
  "audio/%23U74dc%23U848c_baidu_zh.mp3",
  "audio/%23U7518%23U8349_baidu_zh.mp3",
  "audio/%23U7518%23U9042_baidu_zh.mp3",
  "audio/%23U751f%23U5730%23U9ec4_baidu_zh.mp3",
  "audio/%23U751f%23U59dc_baidu_zh.mp3",
  "audio/%23U7533%23U8109_baidu_zh.mp3",
  "audio/%23U756a%23U6cfb%23U53f6_baidu_zh.mp3",
  "audio/%23U75b0%23U590f_google_zh-CN.mp3",
  "audio/%23U767d%23U53ca_baidu_zh.mp3",
  "audio/%23U767d%23U5934%23U7fc1_baidu_zh.mp3",
  "audio/%23U767d%23U672f_baidu_zh.mp3",
  "audio/%23U767d%23U73af%23U4fde_baidu_zh.mp3",
  "audio/%23U767d%23U828d_baidu_zh.mp3",
  "audio/%23U767d%23U82a5%23U5b50_baidu_zh.mp3",
  "audio/%23U767d%23U82b7_baidu_zh.mp3",
  "audio/%23U767d%23U8305%23U6839_baidu_zh.mp3",
  "audio/%23U767e%23U4f1a_baidu_zh.mp3",
  "audio/%23U767e%23U5408_baidu_zh.mp3",
  "audio/%23U76ca%23U667a%23U4ec1_baidu_zh.mp3",
  "audio/%23U76ca%23U6bcd%23U8349_baidu_zh.mp3",
  "audio/%23U7763%23U4fde_baidu_zh.mp3",
  "audio/%23U77b3%23U5b50%23U9ace_google_zh-CN.mp3",
  "audio/%23U77e5%23U6bcd_baidu_zh.mp3",
  "audio/%23U77f3%23U51b3%23U660e_baidu_zh.mp3",
  "audio/%23U77f3%23U818f_baidu_zh.mp3",
  "audio/%23U77f3%23U83d6%23U84b2_baidu_zh.mp3",
  "audio/%23U77f3%23U95e8_baidu_zh.mp3",
  "audio/%23U7802%23U4ec1_baidu_zh.mp3",
  "audio/%23U78c1%23U77f3_baidu_zh.mp3",
  "audio/%23U795e%23U5ead_baidu_zh.mp3",
  "audio/%23U795e%23U66f2_baidu_zh.mp3",
  "audio/%23U795e%23U95e8_baidu_zh.mp3",
  "audio/%23U79e6%23U827d_baidu_zh.mp3",
  "audio/%23U7ae0%23U95e8_baidu_zh.mp3",
  "audio/%23U7af9%23U6ca5_baidu_zh.mp3",
  "audio/%23U7af9%23U8339_baidu_zh.mp3",
  "audio/%23U7b51%23U5bbe_baidu_zh.mp3",
  "audio/%23U7d2b%23U82b1%23U5730%23U4e01_baidu_zh.mp3",
  "audio/%23U7d2b%23U82cf%23U53f6_baidu_zh.mp3",
  "audio/%23U7d2b%23U82cf%23U6897_baidu_zh.mp3",
  "audio/%23U7d2b%23U8349_baidu_zh.mp3",
  "audio/%23U7ea2%23U82b1_baidu_zh.mp3",
  "audio/%23U7ec6%23U8f9b_baidu_zh.mp3",
  "audio/%23U7ecf%23U6e20_baidu_zh.mp3",
  "audio/%23U7eed%23U65ad_baidu_zh.mp3",
  "audio/%23U7f3a%23U76c6_baidu_zh.mp3",
  "audio/%23U7f8c%23U6d3b_baidu_zh.mp3",
  "audio/%23U7ff3%23U660e_google_zh-CN.mp3",
  "audio/%23U8033%23U95e8_baidu_zh.mp3",
  "audio/%23U8089%23U6842_baidu_zh.mp3",
  "audio/%23U8089%23U82c1%23U84c9_baidu_zh.mp3",
  "audio/%23U8089%23U8c46%23U853b_baidu_zh.mp3",
  "audio/%23U809d%23U4fde_baidu_zh.mp3",
  "audio/%23U80a9%23U4e2d%23U4fde_google_zh-CN.mp3",
  "audio/%23U80a9%23U8d1e_baidu_zh.mp3",
  "audio/%23U80a9%23U9ac3_baidu_zh.mp3",
  "audio/%23U80ba%23U4fde_baidu_zh.mp3",
  "audio/%23U80be%23U4fde_baidu_zh.mp3",
  "audio/%23U80c3%23U4fde_baidu_zh.mp3",
  "audio/%23U80c6%23U4fde_baidu_zh.mp3",
  "audio/%23U80c6%23U5357%23U661f_baidu_zh.mp3",
  "audio/%23U80d6%23U5927%23U6d77_baidu_zh.mp3",
  "audio/%23U80e1%23U6912_baidu_zh.mp3",
  "audio/%23U813e%23U4fde_baidu_zh.mp3",
  "audio/%23U8155%23U9aa8_baidu_zh.mp3",
  "audio/%23U8170%23U75db%23U70b9_google_zh-CN.mp3",
  "audio/%23U8179%23U54c0_baidu_zh.mp3",
  "audio/%23U8180%23U80f1%23U4fde_baidu_zh.mp3",
  "audio/%23U8188%23U4fde_baidu_zh.mp3",
  "audio/%23U81bb%23U4e2d_baidu_zh.mp3",
  "audio/%23U81f3%23U9634_baidu_zh.mp3",
  "audio/%23U827e%23U53f6_baidu_zh.mp3",
  "audio/%23U8292%23U785d_baidu_zh.mp3",
  "audio/%23U82a1%23U5b9e_baidu_zh.mp3",
  "audio/%23U82a6%23U6839_baidu_zh.mp3",
  "audio/%23U82ab%23U82b1_baidu_zh.mp3",
  "audio/%23U82b1%23U6912_baidu_zh.mp3",
  "audio/%23U82cd%23U672f_baidu_zh.mp3",
  "audio/%23U82cd%23U8033%23U5b50_baidu_zh.mp3",
  "audio/%23U82e6%23U53c2_baidu_zh.mp3",
  "audio/%23U82e6%23U674f%23U4ec1_baidu_zh.mp3",
  "audio/%23U831c%23U8349_baidu_zh.mp3",
  "audio/%23U832f%23U82d3_baidu_zh.mp3",
  "audio/%23U8335%23U9648%23U84bf_baidu_zh.mp3",
  "audio/%23U8346%23U82a5_baidu_zh.mp3",
  "audio/%23U8349%23U8c46%23U853b_baidu_zh.mp3",
  "audio/%23U83aa%23U672f_baidu_zh.mp3",
  "audio/%23U83b1%23U83d4%23U5b50_baidu_zh.mp3",
  "audio/%23U83b2%23U5b50_baidu_zh.mp3",
  "audio/%23U83ca%23U82b1_baidu_zh.mp3",
  "audio/%23U83df%23U4e1d%23U5b50_baidu_zh.mp3",
  "audio/%23U845b%23U6839_baidu_zh.mp3",
  "audio/%23U84b2%23U516c%23U82f1_baidu_zh.mp3",
  "audio/%23U84b2%23U9ec4_baidu_zh.mp3",
  "audio/%23U8584%23U8377_baidu_zh.mp3",
  "audio/%23U858f%23U82e1%23U4ec1_baidu_zh.mp3",
  "audio/%23U85a4%23U767d_baidu_zh.mp3",
  "audio/%23U85d5%23U8282_baidu_zh.mp3",
  "audio/%23U8702%23U871c_baidu_zh.mp3",
  "audio/%23U8708%23U86a3_baidu_zh.mp3",
  "audio/%23U8749%23U8715_baidu_zh.mp3",
  "audio/%23U8821%23U6c9f_baidu_zh.mp3",
  "audio/%23U8840%23U6d77_baidu_zh.mp3",
  "audio/%23U884c%23U95f4_baidu_zh.mp3",
  "audio/%23U897f%23U6d0b%23U53c2_baidu_zh.mp3",
  "audio/%23U8986%23U76c6%23U5b50_baidu_zh.mp3",
  "audio/%23U89e3%23U6eaa_baidu_zh.mp3",
  "audio/%23U8d64%23U5c0f%23U8c46_baidu_zh.mp3",
  "audio/%23U8d64%23U828d_baidu_zh.mp3",
  "audio/%23U8db3%23U4e09%23U91cc_baidu_zh.mp3",
  "audio/%23U8db3%23U4e34%23U6ce3_baidu_zh.mp3",
  "audio/%23U8db3%23U7a8d%23U9634_baidu_zh.mp3",
  "audio/%23U8db3%23U901a%23U8c37_baidu_zh.mp3",
  "audio/%23U8dd7%23U9633_baidu_zh.mp3",
  "audio/%23U8f66%23U524d%23U5b50_baidu_zh.mp3",
  "audio/%23U8f9b%23U5937%23U82b1_baidu_zh.mp3",
  "audio/%23U8fdc%23U5fd7_baidu_zh.mp3",
  "audio/%23U8fde%23U7fd8_baidu_zh.mp3",
  "audio/%23U901a%23U5929_google_zh-CN.mp3",
  "audio/%23U901a%23U8349_baidu_zh.mp3",
  "audio/%23U901a%23U91cc_baidu_zh.mp3",
  "audio/%23U90c1%23U674e%23U4ec1_baidu_zh.mp3",
  "audio/%23U90c1%23U91d1_baidu_zh.mp3",
  "audio/%23U90c4%23U95e8_baidu_zh.mp3",
  "audio/%23U9178%23U67a3%23U4ec1_baidu_zh.mp3",
  "audio/%23U91cc%23U5185%23U5ead_baidu_zh.mp3",
  "audio/%23U91d1%23U94f6%23U82b1_baidu_zh.mp3",
  "audio/%23U91d1%23U95e8_baidu_zh.mp3",
  "audio/%23U94a9%23U85e4_baidu_zh.mp3",
  "audio/%23U957f%23U5f3a_baidu_zh.mp3",
  "audio/%23U95f4%23U4f7f_baidu_zh.mp3",
  "audio/%23U9632%23U98ce_baidu_zh.mp3",
  "audio/%23U9633%23U4ea4_baidu_zh.mp3",
  "audio/%23U9633%23U6c60_baidu_zh.mp3",
  "audio/%23U9633%23U6eaa_baidu_zh.mp3",
  "audio/%23U9633%23U8c37_baidu_zh.mp3",
  "audio/%23U9633%23U8f85_baidu_zh.mp3",
  "audio/%23U9633%23U9675%23U6cc9_baidu_zh.mp3",
  "audio/%23U9634%23U8c37_baidu_zh.mp3",
  "audio/%23U9634%23U90c4_baidu_zh.mp3",
  "audio/%23U9634%23U9675%23U6cc9_baidu_zh.mp3",
  "audio/%23U963f%23U80f6_baidu_zh.mp3",
  "audio/%23U9644%23U5b50_baidu_zh.mp3",
  "audio/%23U9648%23U76ae_baidu_zh.mp3",
  "audio/%23U9677%23U8c37_baidu_zh.mp3",
  "audio/%23U9690%23U767d_baidu_zh.mp3",
  "audio/%23U9752%23U84bf_baidu_zh.mp3",
  "audio/%23U9760%23U5c71_google_zh-CN.mp3",
  "audio/%23U988a%23U8f66_baidu_zh.mp3",
  "audio/%23U98a7%23U9ace_google_zh-CN.mp3",
  "audio/%23U98ce%23U5e9c_baidu_zh.mp3",
  "audio/%23U98ce%23U6c60_google_zh-CN.mp3",
  "audio/%23U98ce%23U95e8_baidu_zh.mp3",
  "audio/%23U98de%23U626c_baidu_zh.mp3",
  "audio/%23U9999%23U85b7_baidu_zh.mp3",
  "audio/%23U9999%23U9644_baidu_zh.mp3",
  "audio/%23U9ad8%23U826f%23U59dc_baidu_zh.mp3",
  "audio/%23U9c7c%23U8165%23U8349_baidu_zh.mp3",
  "audio/%23U9c7c%23U8170_google_zh-CN.mp3",
  "audio/%23U9c7c%23U9645_baidu_zh.mp3",
  "audio/%23U9cd6%23U7532_baidu_zh.mp3",
  "audio/%23U9e20%23U5c3e_baidu_zh.mp3",
  "audio/%23U9e21%23U5185%23U91d1_baidu_zh.mp3",
  "audio/%23U9e21%23U8840%23U85e4_baidu_zh.mp3",
  "audio/%23U9e7f%23U8338_baidu_zh.mp3",
  "audio/%23U9e9d%23U9999_baidu_zh.mp3",
  "audio/%23U9ea6%23U51ac_baidu_zh.mp3",
  "audio/%23U9ea6%23U82bd_baidu_zh.mp3",
  "audio/%23U9ebb%23U9ec4_baidu_zh.mp3",
  "audio/%23U9ec4%23U67cf_baidu_zh.mp3",
  "audio/%23U9ec4%23U7cbe_baidu_zh.mp3",
  "audio/%23U9ec4%23U82a9_baidu_zh.mp3",
  "audio/%23U9ec4%23U82aa_baidu_zh.mp3",
  "audio/%23U9ec4%23U8fde_baidu_zh.mp3",
  "audio/%23U9f99%23U773c%23U8089_baidu_zh.mp3",
  "audio/%23U9f99%23U80c6%23U8349_baidu_zh.mp3",
  "audio/%23U9f99%23U9aa8_baidu_zh.mp3",
  "audio/%23U9f9f%23U677f_baidu_zh.mp3"
];

function scopedUrl(asset){
  return new URL(asset, self.registration.scope).toString();
}

function withoutSearch(urlString){
  const url = new URL(urlString);
  url.search = "";
  url.hash = "";
  return url.toString();
}

async function cacheAssetList(list, onProgress){
  const cache = await caches.open(MTC_CACHE_NAME);
  let ok = 0;
  const failed = [];
  const total = Math.max(1, list.length);
  let lastPercent = -1;
  for(let index = 0; index < list.length; index += 1){
    const asset = list[index];
    const url = scopedUrl(asset);
    try{
      const response = await fetch(url, {cache:"reload"});
      if(response && (response.ok || response.type === "opaque")){
        await cache.put(withoutSearch(url), response.clone());
        ok += 1;
      }else{
        failed.push(asset);
      }
    }catch(error){
      failed.push(asset);
    }
    if(typeof onProgress === "function"){
      const percent = Math.floor(((index + 1) / total) * 100);
      if(percent !== lastPercent || index === list.length - 1){
        lastPercent = percent;
        onProgress({index:index + 1, total, percent, ok, failedCount:failed.length, asset});
      }
    }
  }
  return {ok, failedCount: failed.length, failed: failed.slice(0, 12)};
}

self.addEventListener("install", event => {
  event.waitUntil(cacheAssetList(CORE_ASSETS).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(name => name.startsWith("connections-mtc-") && name !== MTC_CACHE_NAME ? caches.delete(name) : null));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  const data = event.data || {};
  if(data.type !== "PRECACHE_OFFLINE") return;
  const includeAudio = Boolean(data.includeAudio);
  event.waitUntil((async () => {
    const port = event.ports && event.ports[0];
    const sendProgress = data => {
      if(port) port.postMessage(Object.assign({progress:true}, data || {}));
    };
    sendProgress({label: includeAudio ? "hors connexion + audio" : "hors connexion", percent:4, message:"Préparation de la liste des fichiers…"});
    const core = await cacheAssetList(CORE_ASSETS, info => {
      const percent = includeAudio ? Math.round(6 + info.percent * 0.24) : Math.round(8 + info.percent * 0.86);
      sendProgress({
        label: includeAudio ? "jeu" : "hors connexion",
        percent,
        message:`Jeu : ${info.index}/${info.total} fichiers`
      });
    });
    const audio = includeAudio ? await cacheAssetList(AUDIO_ASSETS, info => {
      const percent = Math.round(31 + info.percent * 0.67);
      sendProgress({
        label:"audio",
        percent,
        message:`Audios : ${info.index}/${info.total} fichiers`
      });
    }) : {ok:0, failedCount:0, failed:[]};
    sendProgress({label:"hors connexion", percent:99, message:"Finalisation du cache hors connexion…"});
    if(port){
      port.postMessage({ok:true, version:MTC_OFFLINE_VERSION, includeAudio, core, audio});
    }
  })().catch(error => {
    if(event.ports && event.ports[0]){
      event.ports[0].postMessage({ok:false, message:String(error && error.message || error)});
    }
  }));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if(!request || request.method !== "GET") return;
  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  if(requestUrl.origin !== scopeUrl.origin) return;
  if(!requestUrl.pathname.startsWith(scopeUrl.pathname)) return;

  if(request.mode === "navigate"){
    event.respondWith((async () => {
      try{
        const response = await fetch(request);
        const cache = await caches.open(MTC_CACHE_NAME);
        await cache.put(scopedUrl("index.html"), response.clone());
        return response;
      }catch(error){
        return (await caches.match(scopedUrl("index.html"))) || (await caches.match(scopedUrl("./"))) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const normalized = withoutSearch(request.url);
    const cached = await caches.match(request) || await caches.match(normalized);
    if(cached) return cached;
    try{
      const response = await fetch(request);
      if(response && (response.ok || response.type === "opaque")){
        const cache = await caches.open(MTC_CACHE_NAME);
        await cache.put(normalized, response.clone());
      }
      return response;
    }catch(error){
      return cached || Response.error();
    }
  })());
});
