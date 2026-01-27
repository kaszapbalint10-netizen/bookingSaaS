// server/src/utils/workflow.js

const workflows = {
  'car-rental': {
    name: 'car_rental_booking',
    start: 'detect_intent',
    steps: {
      detect_intent: {
        next: {
          booking: 'show_categories',
          inquiry: 'answer_inquiry',
          unknown: 'detect_intent'
        }
      },
      // Booking flow
      show_categories: { next: 'ask_category' },
      ask_category: { next: 'ask_dates' },
      ask_dates: { next: 'ask_locations' },
      ask_locations: { next: 'ask_user_data' },
      ask_user_data: { next: 'confirm_booking' },
      confirm_booking: { next: 'save_booking' },
      save_booking: { next: 'done' },

      // Általános kérdés
      answer_inquiry: { next: 'done' },
      done: {}
    }
  }
};

function getWorkflow(type) {
  return workflows[type] || workflows['car-rental'];
}

function getNextStep(type, currentStep, intent) {
  const wf = getWorkflow(type);
  const step = wf?.steps?.[currentStep];
  if (!step) return wf.start || 'detect_intent';

  if (step.next && typeof step.next === 'object') {
    return step.next[intent] || step.next.unknown || wf.start || 'detect_intent';
  }
  if (typeof step.next === 'string') return step.next;
  return 'done';
}

// Kötelező helyek ellenőrzése (pickup & return)
function needsLocations(entities = {}) {
  return !(entities.pickupLocation && entities.returnLocation);
}

function nextLocationQuestion(entities = {}) {
  if (!entities.pickupLocation && !entities.returnLocation) {
    return 'Hol vennéd fel az autót, és hol szeretnéd leadni? (lehet ugyanaz is)';
  }
  if (!entities.pickupLocation) return 'Hol vennéd fel az autót?';
  if (!entities.returnLocation) return 'Hol szeretnéd leadni? (lehet ugyanaz is)';
  return null;
}

module.exports = {
  workflows,
  getWorkflow,
  getNextStep,
  needsLocations,
  nextLocationQuestion
};
