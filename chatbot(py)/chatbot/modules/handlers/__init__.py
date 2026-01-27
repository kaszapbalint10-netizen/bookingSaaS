# chatbot/modules/handlers/__init__.py
from .commands_base import (
    start_command,
    quick_appointment_command, 
    opening_hours_command,
    help_command
)
from .messages import handle_intelligent_message

__all__ = [
    'start_command',
    'quick_appointment_command',
    'opening_hours_command', 
    'help_command',
    'handle_intelligent_message'
]