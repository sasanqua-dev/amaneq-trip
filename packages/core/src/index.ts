// Supabase client
export { createTypedSupabaseClient } from "./supabase";
export type { TypedSupabaseClient } from "./supabase";

// Types
export type {
  Database,
  TripStatus,
  MemberRole,
  ExpenseCategory,
  ItineraryCategory,
  TransportType,
} from "./types";

// Auth
export { ensureUser } from "./auth";

// Queries
export {
  getCurrentUser,
  getUserByEmail,
  updateUserProfile,
  upsertUser,
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripMembers,
  checkMembership,
  addTripMember,
  updateMemberRole,
  removeTripMember,
  getItineraryItems,
  createItineraryItem,
  updateItineraryItem,
  moveItineraryItem,
  deleteItineraryItem,
  getExpenses,
  createExpense,
  deleteExpense,
  createShareLink,
  getShareLinks,
  getSharedTripByToken,
  deactivateShareLink,
  getPrefectureVisits,
  upsertPrefectureVisit,
  getPrefectureSpots,
} from "./queries";

// Realtime
export { subscribeToTable } from "./realtime";
