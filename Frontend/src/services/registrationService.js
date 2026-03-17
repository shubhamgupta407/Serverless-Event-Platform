import { db } from "../firebase";
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy, doc, runTransaction } from "firebase/firestore";

/**
 * Registers a user for an event and returns a mock payment status/ticket.
 * @param {string} userId - Auth user ID.
 * @param {string} eventId - Specific event ID.
 * @param {object} registrationData - Event and user specific details like team Name, participation, amount.
 */
export const registerForEvent = async (userId, eventId, registrationData = {}) => {
  if (!userId || !eventId) return false;

  try {
    const q = query(
      collection(db, "registrations"),
      where("userId", "==", userId),
      where("eventId", "==", eventId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) return true; // Already registered

    // Use a transaction to safely decrement available seats if applicable
    const eventRef = doc(db, "events", eventId);
    let successfulRegistration = false;

    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error("Event does not exist!");
      }

      const eventData = eventDoc.data();
      
      // If the event has a limited number of seats
      if (eventData.maxSeats !== null && eventData.maxSeats !== undefined) {
        if ((eventData.availableSeats || 0) <= 0) {
          throw new Error("Sorry, this event is fully booked!");
        }
        transaction.update(eventRef, { availableSeats: (eventData.availableSeats || 0) - 1 });
      }

      // Add the registration document
      const newRegistrationRef = doc(collection(db, "registrations"));
      transaction.set(newRegistrationRef, {
        userId,
        eventId,
        ...registrationData, // paymentId, orderId, teamDetails, etc.
        registeredAt: serverTimestamp(),
        status: 'confirmed',
        ticketId: `TKT-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`
      });

      successfulRegistration = true;
    });
    
    return successfulRegistration;
  } catch (error) {
    console.error("Error registering for event:", error);
    return false;
  }
};

/**
 * Gets just the Event IDs a user is registered for (useful for buttons)
 */
export const getUserRegisteredEventIds = async (userId) => {
  if (!userId) return [];
  try {
    const q = query(collection(db, "registrations"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data().eventId);
  } catch (error) {
    console.error("Error fetching user registrations:", error);
    return [];
  }
};

/**
 * Gets full ticket/registration objects for the My Tickets page
 */
export const getUserTickets = async (userId) => {
  if (!userId) return [];
  try {
    const q = query(collection(db, "registrations"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const tickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort locally since we don't have a composite index set up yet
    return tickets.sort((a, b) => b.registeredAt?.toMillis() - a.registeredAt?.toMillis());
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    return [];
  }
};
