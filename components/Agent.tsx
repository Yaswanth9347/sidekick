import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Loader2, CheckCircle, AlertTriangle, Info, Shield, Eye, Calendar, Server, Users as UsersIcon, Settings, BarChart, Zap } from 'lucide-react';
import { useGlobal } from '../store';
import { AccessControlService } from '../services';
import { ViewState, Appointment, Instance, User as UserType, Tenant, InstanceStatus } from '../types';

interface Message {
    id: string;
    sender: 'user' | 'agent';
    text: string;
    type?: 'info' | 'success' | 'error' | 'warning';
    timestamp: Date;
    actions?: Array<{ label: string; onClick: () => void }>;
}

interface CommandIntent {
    action: 'create' | 'edit' | 'delete' | 'navigate' | 'view' | 'list' | 'start' | 'stop' | 'restart' | 'update' | 'unknown';
    entity: 'appointment' | 'instance' | 'user' | 'tenant' | 'page' | 'setting' | 'unknown';
    params: Record<string, any>;
}

// Helper to find elements by text content with retry
const findElementByText = (text: string, selector: string = '*', rootElement: HTMLElement | Document = document): HTMLElement | null => {
    const elements = rootElement.querySelectorAll(selector);
    const searchText = text.toLowerCase().trim();

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;

        // Skip hidden elements (simple check)
        if (el.offsetParent === null) continue;

        const textContent = el.textContent?.toLowerCase().trim() || '';

        if (textContent === searchText || textContent.includes(searchText)) {
            if (selector === 'button') {
                const directText = Array.from(el.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.textContent?.toLowerCase().trim())
                    .join(' ');

                // Strict check for buttons to avoid "Schedule Appointment" matching "Create Schedule" loosely if not careful
                // But generally include check is okay if unique enough. 
                // We add a specific check: if looking for "Create", don't match "Create Appointment" if purely "Create" was asked, unless fallback
                if (directText.includes(searchText) || textContent === searchText) {
                    return el;
                }
            } else if (selector === 'a' || el.children.length === 0) {
                return el;
            } else if (selector.includes('h3') || selector.includes('div')) {
                // For modals headers etc
                if (textContent.includes(searchText)) return el;
            }
        }
    }
    return null;
};

// Wait for element to appear in DOM
const waitForElement = async (
    text: string,
    selector: string = 'button',
    maxAttempts: number = 10,
    delayMs: number = 500,
    rootElement: HTMLElement | Document = document
): Promise<HTMLElement | null> => {
    for (let i = 0; i < maxAttempts; i++) {
        const element = findElementByText(text, selector, rootElement);
        if (element) {
            return element;
        }
        await wait(delayMs);
    }
    return null;
};

// React Input Setter Helper
const setReactInputValue = (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) => {
    try {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        )?.set;

        const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLSelectElement.prototype,
            'value'
        )?.set;

        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
        )?.set;

        if (element instanceof HTMLInputElement && nativeInputValueSetter) {
            nativeInputValueSetter.call(element, value);
        } else if (element instanceof HTMLSelectElement && nativeSelectValueSetter) {
            nativeSelectValueSetter.call(element, value);
        } else if (element instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
            nativeTextAreaValueSetter.call(element, value);
        }

        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        element.focus();
    } catch (error) {
        console.error('Error setting input value:', error);
    }
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const Agent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const {
        user,
        navigate,
        appointments,
        instances,
        users,
        tenants,
        currentView,
        setAppointments,
        setInstances,
        setUsers,
        setTenants,
        notify,
        addNotification
    } = useGlobal();

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'initial-1',
            sender: 'agent',
            text: `👋 Hello ${user?.name}! I'm your autonomous PairMind AI Agent.\n\n🎯 I can control the ENTIRE application for you:\n\n📅 **Appointments**: Create, list, delete\n🖥️ **Instances**: Create, start, stop, restart, delete\n👥 **Users**: Create, edit, delete, manage roles\n🏢 **Tenants**: Create, manage, suspend\n🧭 **Navigation**: Go to any page\n⚙️ **Settings**: Update configurations\n📊 **Analytics**: View reports\n\n💡 Try: "Create an appointment for tomorrow at 5 PM with John Doe"\n💡 Or: "Start instance Sales-Bot-01"\n💡 Or: "Show all users"`,
            timestamp: new Date(),
            type: 'info'
        }
    ]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [awaitingConfirmation, setAwaitingConfirmation] = useState<{ action: () => Promise<void>, message: string } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const messageIdCounter = useRef(0);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const addMessage = (text: string, sender: 'agent' | 'user' = 'agent', type: 'info' | 'success' | 'error' | 'warning' = 'info', actions?: Array<{ label: string; onClick: () => void }>) => {
        messageIdCounter.current += 1;
        const uniqueId = `msg-${Date.now()}-${messageIdCounter.current}`;

        setMessages(prev => [...prev, {
            id: uniqueId,
            sender,
            text,
            type,
            timestamp: new Date(),
            actions
        }]);
    };

    // Parse natural language command
    const parseCommand = (command: string): CommandIntent => {
        const lower = command.toLowerCase();
        const intent: CommandIntent = {
            action: 'unknown',
            entity: 'unknown',
            params: {}
        };

        // Detect action
        if (lower.includes('create') || lower.includes('add') || lower.includes('new')) {
            intent.action = 'create';
        } else if (lower.includes('edit') || lower.includes('update') || lower.includes('modify') || lower.includes('change')) {
            intent.action = 'edit';
        } else if (lower.includes('delete') || lower.includes('remove') || lower.includes('cancel')) {
            intent.action = 'delete';
        } else if (lower.includes('navigate') || lower.includes('go to') || lower.includes('open') || lower.includes('show me')) {
            intent.action = 'navigate';
        } else if (lower.includes('view') || lower.includes('see') || lower.includes('display')) {
            intent.action = 'view';
        } else if (lower.includes('list') || lower.includes('show all') || lower.includes('show')) {
            intent.action = 'list';
        } else if (lower.includes('start') || lower.includes('launch') || lower.includes('boot')) {
            intent.action = 'start';
        } else if (lower.includes('stop') || lower.includes('shutdown') || lower.includes('halt')) {
            intent.action = 'stop';
        } else if (lower.includes('restart') || lower.includes('reboot')) {
            intent.action = 'restart';
        }

        // Detect entity
        if (lower.includes('appointment') || lower.includes('meeting') || lower.includes('schedule')) {
            intent.entity = 'appointment';
        } else if (lower.includes('instance') || lower.includes('bot')) {
            intent.entity = 'instance';
        } else if (lower.includes('user') || lower.includes('member') || lower.includes('account')) {
            intent.entity = 'user';
        } else if (lower.includes('tenant') || lower.includes('organization') || lower.includes('company')) {
            intent.entity = 'tenant';
        } else if (lower.includes('dashboard') || lower.includes('page') || lower.includes('analytics') || lower.includes('settings') || lower.includes('chat')) {
            intent.entity = 'page';
        } else if (lower.includes('setting') || lower.includes('config')) {
            intent.entity = 'setting';
        }

        // Extract parameters
        // Date extraction
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        if (lower.includes('tomorrow')) {
            intent.params.date = tomorrow.toISOString().split('T')[0];
        } else if (lower.includes('today')) {
            intent.params.date = today.toISOString().split('T')[0];
        } else if (lower.includes('next week')) {
            intent.params.date = nextWeek.toISOString().split('T')[0];
        }

        // Time extraction
        const timeMatch = lower.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2] || '00';
            const meridiem = timeMatch[3];

            if (meridiem === 'pm' && hours < 12) hours += 12;
            if (meridiem === 'am' && hours === 12) hours = 0;

            intent.params.time = `${hours.toString().padStart(2, '0')}:${minutes}`;
        }

        // Name extraction (for appointments, users, instances)
        const withMatch = lower.match(/with\s+([a-z\s]+?)(?:\s+at|\s+on|\s+for|$)/i);
        if (withMatch) {
            intent.params.name = withMatch[1].trim();
        }

        // Instance name extraction
        const instanceMatch = lower.match(/instance\s+([a-z0-9\-]+)/i);
        if (instanceMatch) {
            intent.params.instanceName = instanceMatch[1].trim();
        }

        return intent;
    };

    // Process command
    const processCommand = async (command: string) => {
        setIsProcessing(true);
        addMessage(command, 'user');
        addMessage(`🔍 Analyzing: "${command}"`, 'agent', 'info');
        await wait(300);

        const intent = parseCommand(command);

        try {
            // Route to appropriate handler
            if (intent.entity === 'appointment') {
                await handleAppointmentCommand(intent);
            } else if (intent.entity === 'instance') {
                await handleInstanceCommand(intent);
            } else if (intent.entity === 'user') {
                await handleUserCommand(intent);
            } else if (intent.entity === 'tenant') {
                await handleTenantCommand(intent);
            } else if (intent.entity === 'page') {
                await handleNavigationCommand(command);
            } else if (intent.entity === 'setting') {
                await handleSettingCommand(intent);
            } else {
                addMessage('❓ I\'m not sure what you want me to do. Try:\n• "Create appointment tomorrow at 5 PM"\n• "Start instance Sales-Bot-01"\n• "Show all users"\n• "Go to Dashboard"', 'agent', 'warning');
            }
        } catch (error: any) {
            addMessage(`❌ Error: ${error.message}`, 'agent', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // APPOINTMENT HANDLERS
    const handleAppointmentCommand = async (intent: CommandIntent) => {
        if (intent.action === 'create') {
            await handleCreateAppointment(intent.params);
        } else if (intent.action === 'list') {
            await handleListAppointments();
        } else if (intent.action === 'delete') {
            await handleDeleteAppointment(intent.params);
        } else {
            addMessage('❓ For appointments, I can: create, list, or delete. Try: "Create appointment tomorrow at 5 PM with John"', 'agent', 'warning');
        }
    };

    const handleCreateAppointment = async (params: Record<string, any>) => {
        // Permission check
        addMessage('🔐 Checking permissions...', 'agent', 'info');
        await wait(500);

        if (!AccessControlService.canCreateAppointment(user!)) {
            addMessage(
                `⛔ Permission Denied\n\nYour role (${user?.role}) does not allow creating appointments.\nOnly Super Admins and Tenant Admins can create appointments.`,
                'agent',
                'error'
            );
            return;
        }

        addMessage('✅ Permission verified', 'agent', 'success');
        await wait(300);

        // Validate parameters
        const customerName = params.name || 'Agent Created Appointment';
        const date = params.date || new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const time = params.time || '17:00';

        addMessage(`📋 Appointment Details:\n• Customer: ${customerName}\n• Date: ${date}\n• Time: ${time}`, 'agent', 'info');
        await wait(500);

        // Check for conflicts
        addMessage('🔍 Checking for scheduling conflicts...', 'agent', 'info');
        await wait(800);

        const conflict = appointments.find(apt =>
            apt.date === date &&
            apt.time === time &&
            apt.status !== 'Cancelled'
        );

        if (conflict) {
            addMessage(
                `⚠️ Conflict Detected\n\nAn appointment already exists at ${date} ${time} with ${conflict.customerName}.\n\nWould you like to:\n• Choose a different time\n• Cancel the existing appointment`,
                'agent',
                'warning'
            );
            return;
        }

        addMessage('✅ No conflicts found', 'agent', 'success');
        await wait(300);

        // Navigate to appointments page
        if (currentView !== 'APPOINTMENTS') {
            addMessage('🧭 Navigating to Appointments page...', 'agent', 'info');
            navigate('APPOINTMENTS');
            await wait(2000);
        }

        // Wait for and click button
        addMessage('🖱️ Looking for "Schedule Appointment" button...', 'agent', 'info');

        const createBtn = await waitForElement('Schedule Appointment', 'button', 15, 500);
        if (!createBtn) {
            addMessage('❌ Could not find "Schedule Appointment" button. Creating appointment directly...', 'agent', 'warning');

            // Direct creation fallback
            const newAppointment: Appointment = {
                id: `apt-${Math.floor(Math.random() * 10000)}`,
                customerName,
                date,
                time,
                status: 'Pending',
                assignedBot: 'Sales-Bot-01'
            };

            await setAppointments([newAppointment, ...appointments]);
            addMessage(`🎉 Success!\n\nAppointment created:\n• Customer: ${customerName}\n• Date: ${date}\n• Time: ${time}`, 'agent', 'success');
            addNotification({
                type: 'success' as any,
                title: 'Appointment Created',
                message: `New appointment scheduled for ${customerName}`
            });
            return;
        }
        addMessage('✅ Found button, clicking...', 'agent', 'info');
        createBtn.click();
        await wait(1500);

        // 6. Wait for modal existence
        addMessage('📝 Waiting for appointment form modal...', 'agent', 'info');

        // Find the modal header to confirm it opened
        const modalHeader = await waitForElement('Schedule Appointment', 'h3', 10, 500);
        let modalContainer: HTMLElement | Document = document;

        if (modalHeader) {
            // Traverse up to find the main modal container
            // Header -> div (flex) -> div (modal content)
            const parent1 = modalHeader.parentElement;
            const parent2 = parent1?.parentElement;
            if (parent2) {
                modalContainer = parent2;
                // Highlight the modal to show we found it (for demo purposes implies focus)
                parent2.style.boxShadow = '0 0 0 2px #6366f1';
                setTimeout(() => { parent2.style.boxShadow = ''; }, 1000);
            }
        } else {
            addMessage('⚠️ Could not detect modal header. Attempting to find form blindly...', 'agent', 'warning');
        }

        addMessage('📝 Filling appointment form...', 'agent', 'info');
        await wait(500);

        const allInputs = modalContainer.querySelectorAll('input, select, textarea');
        let filledCount = 0;
        const filledFields: string[] = [];

        allInputs.forEach(el => {
            const element = el as HTMLInputElement;
            // Skip hidden elements or search bars
            if (element.type === 'hidden' || element.offsetParent === null) return;

            const placeholder = element.placeholder?.toLowerCase() || '';
            const type = element.type;
            const name = element.name?.toLowerCase() || '';
            const label = element.labels?.[0]?.textContent?.toLowerCase() || '';

            // Explicitly skip search inputs
            if (type === 'search' || placeholder.includes('search') || name.includes('search')) return;

            if ((placeholder.includes('customer') || placeholder.includes('name') ||
                name.includes('customer') || label.includes('customer')) &&
                !element.value) {
                setReactInputValue(element, customerName);
                filledCount++;
                filledFields.push('Customer Name');
            }
            else if ((type === 'date' || name.includes('date') || label.includes('date')) &&
                !element.value) {
                setReactInputValue(element, date);
                filledCount++;
                filledFields.push('Date');
            }
            else if ((type === 'time' || name.includes('time') || label.includes('time')) &&
                !element.value) {
                setReactInputValue(element, time);
                filledCount++;
                filledFields.push('Time');
            }
        });

        if (filledCount > 0) {
            addMessage(`✅ Filled ${filledCount} form fields: ${filledFields.join(', ')}`, 'agent', 'success');
        } else {
            addMessage('⚠️ Warning: No matching fields found in the modal.', 'agent', 'warning');
        }

        await wait(1000);

        // Submit - Look for "Create Schedule" or similar inside the modal
        addMessage('📤 Looking for submit button...', 'agent', 'info');
        await wait(500);

        const submitBtn = await waitForElement('Create Schedule', 'button', 5, 300, modalContainer) ||
            await waitForElement('Schedule', 'button', 3, 300, modalContainer) ||
            await waitForElement('Save', 'button', 3, 300, modalContainer);

        if (submitBtn) {
            addMessage('✅ Found submit button, clicking...', 'agent', 'info');
            submitBtn.click();
            await wait(2000);

            // Validate if modal closed (success) or still open (error/validation)
            if (modalHeader && document.body.contains(modalHeader)) {
                addMessage('⚠️ The modal is still open. Submission might have failed or validation errors exist.', 'agent', 'warning');
            } else {
                addMessage(
                    `🎉 Success!\n\nAppointment created:\n• Customer: ${customerName}\n• Date: ${date}\n• Time: ${time}`,
                    'agent',
                    'success'
                );

                addNotification({
                    type: 'success' as any,
                    title: 'Appointment Created',
                    message: `New appointment scheduled for ${customerName} on ${date} at ${time}`
                });
            }
        } else {
            addMessage('⚠️ Form filled, please click submit manually.', 'agent', 'warning');
        }
    };

    const handleListAppointments = async () => {
        addMessage('🔐 Checking permissions...', 'agent', 'info');
        await wait(300);

        if (!AccessControlService.canViewAppointments(user!)) {
            addMessage('⛔ Permission Denied: You cannot view appointments.', 'agent', 'error');
            return;
        }

        if (currentView !== 'APPOINTMENTS') {
            addMessage('🧭 Navigating to Appointments page...', 'agent', 'info');
            navigate('APPOINTMENTS');
            await wait(1500);
        }

        const total = appointments.length;
        const upcoming = appointments.filter(apt => new Date(apt.date) >= new Date()).length;
        const confirmed = appointments.filter(apt => apt.status === 'Confirmed').length;
        const pending = appointments.filter(apt => apt.status === 'Pending').length;

        addMessage(
            `📅 Appointments Summary:\n\n• Total: ${total}\n• Upcoming: ${upcoming}\n• Confirmed: ${confirmed}\n• Pending: ${pending}\n\nYou are now viewing the Appointments page.`,
            'agent',
            'success'
        );
    };

    const handleDeleteAppointment = async (params: Record<string, any>) => {
        if (!params.name) {
            addMessage('❓ Please specify which appointment to delete (e.g., "Delete appointment with John").', 'agent', 'warning');
            return;
        }

        const toDelete = appointments.find(apt =>
            apt.customerName.toLowerCase().includes(params.name.toLowerCase())
        );

        if (!toDelete) {
            addMessage(`❌ No appointment found with "${params.name}".`, 'agent', 'error');
            return;
        }

        addMessage(
            `⚠️ Confirm Deletion\n\nAppointment: ${toDelete.customerName}\nDate: ${toDelete.date}\nTime: ${toDelete.time}\n\nType "yes" to confirm or "no" to cancel.`,
            'agent',
            'warning'
        );

        setAwaitingConfirmation({
            message: 'delete_appointment',
            action: async () => {
                const updated = appointments.filter(apt => apt.id !== toDelete.id);
                await setAppointments(updated);
                addMessage(`✅ Appointment with ${toDelete.customerName} has been deleted.`, 'agent', 'success');
            }
        });
    };

    // INSTANCE HANDLERS
    const handleInstanceCommand = async (intent: CommandIntent) => {
        if (intent.action === 'create') {
            await handleCreateInstance(intent.params);
        } else if (intent.action === 'list') {
            await handleListInstances();
        } else if (intent.action === 'start') {
            await handleStartInstance(intent.params);
        } else if (intent.action === 'stop') {
            await handleStopInstance(intent.params);
        } else if (intent.action === 'restart') {
            await handleRestartInstance(intent.params);
        } else if (intent.action === 'delete') {
            await handleDeleteInstance(intent.params);
        } else {
            addMessage('❓ For instances, I can: create, list, start, stop, restart, or delete. Try: "Start instance Sales-Bot-01"', 'agent', 'warning');
        }
    };

    const handleCreateInstance = async (params: Record<string, any>) => {
        addMessage('🔐 Checking permissions...', 'agent', 'info');
        await wait(300);

        if (!AccessControlService.canCreateInstance(user!)) {
            addMessage(`⛔ Permission Denied: Your role (${user?.role}) cannot create instances.`, 'agent', 'error');
            return;
        }

        addMessage('✅ Permission verified', 'agent', 'success');

        if (currentView !== 'INSTANCES') {
            addMessage('🧭 Navigating to Instances page...', 'agent', 'info');
            navigate('INSTANCES');
            await wait(2000);
        }

        addMessage('🖱️ Looking for "Create Instance" button...', 'agent', 'info');

        const createBtn = await waitForElement('Create Instance', 'button', 15, 500) ||
            await waitForElement('New Instance', 'button', 5, 500);

        if (!createBtn) {
            addMessage('❌ Could not find "Create Instance" button. Creating instance directly...', 'agent', 'warning');

            const newInstance: Instance = {
                id: `inst-${Math.floor(Math.random() * 10000)}`,
                name: params.name || `Agent-Instance-${Date.now()}`,
                tier: 'Pro' as any,
                status: 'Provisioning' as any,
                region: 'us-east-1',
                version: '2.1.0',
                uptime: '0h',
                created: new Date().toISOString(),
                health: 100
            };

            await setInstances([newInstance, ...instances]);
            addMessage(`🎉 Success! Instance "${newInstance.name}" created and provisioning.`, 'agent', 'success');
            addNotification({
                type: 'success' as any,
                title: 'Instance Created',
                message: `New instance ${newInstance.name} is being provisioned`
            });
            return;
        }

        addMessage('✅ Found button, clicking...', 'agent', 'info');
        createBtn.click();
        await wait(1500);

        addMessage('📝 Please complete the instance creation form manually, or I can create it directly.', 'agent', 'info');
    };

    const handleListInstances = async () => {
        addMessage('🔐 Checking permissions...', 'agent', 'info');
        await wait(300);

        if (!AccessControlService.canViewInstances(user!)) {
            addMessage('⛔ Permission Denied: You cannot view instances.', 'agent', 'error');
            return;
        }

        if (currentView !== 'INSTANCES') {
            addMessage('🧭 Navigating to Instances page...', 'agent', 'info');
            navigate('INSTANCES');
            await wait(1500);
        }

        const total = instances.length;
        const online = instances.filter(inst => inst.status === 'Online' || inst.status === 'Active').length;
        const offline = instances.filter(inst => inst.status === 'Offline').length;

        addMessage(
            `🖥️ Instances Overview:\n\n• Total: ${total}\n• Online: ${online}\n• Offline: ${offline}\n\nYou are now viewing the Instances page.`,
            'agent',
            'success'
        );
    };

    const handleStartInstance = async (params: Record<string, any>) => {
        if (!params.instanceName) {
            addMessage('❓ Please specify which instance to start (e.g., "Start instance Sales-Bot-01").', 'agent', 'warning');
            return;
        }

        // Permission check
        if (!AccessControlService.canManageInstances(user!)) {
            addMessage('⛔ Permission Denied: You cannot manage instances.', 'agent', 'error');
            return;
        }

        // Navigate first to show the action
        if (currentView !== 'INSTANCES') {
            addMessage('🧭 Navigating to Instances page...', 'agent', 'info');
            navigate('INSTANCES');
            await wait(1500);
        }

        const instance = instances.find(inst =>
            inst.name.toLowerCase().includes(params.instanceName.toLowerCase())
        );

        if (!instance) {
            addMessage(`❌ No instance found matching "${params.instanceName}".`, 'agent', 'error');
            return;
        }

        if (instance.status === 'Online' || instance.status === 'Active') {
            addMessage(`ℹ️ Instance "${instance.name}" is already running.`, 'agent', 'info');
            return;
        }

        addMessage(`🚀 Starting instance "${instance.name}"...`, 'agent', 'info');
        await wait(1500);

        const updated = instances.map(inst =>
            inst.id === instance.id
                ? { ...inst, status: 'Online' as InstanceStatus }
                : inst
        );

        await setInstances(updated);

        addMessage(`✅ Instance "${instance.name}" is now online!`, 'agent', 'success');
        addNotification({
            type: 'success' as any,
            title: 'Instance Started',
            message: `${instance.name} is now running`
        });
    };

    const handleStopInstance = async (params: Record<string, any>) => {
        if (!params.instanceName) {
            addMessage('❓ Please specify which instance to stop (e.g., "Stop instance Sales-Bot-01").', 'agent', 'warning');
            return;
        }

        if (!AccessControlService.canManageInstances(user!)) {
            addMessage('⛔ Permission Denied: You cannot manage instances.', 'agent', 'error');
            return;
        }

        if (currentView !== 'INSTANCES') {
            addMessage('🧭 Navigating to Instances page...', 'agent', 'info');
            navigate('INSTANCES');
            await wait(1500);
        }

        const instance = instances.find(inst =>
            inst.name.toLowerCase().includes(params.instanceName.toLowerCase())
        );

        if (!instance) {
            addMessage(`❌ No instance found matching "${params.instanceName}".`, 'agent', 'error');
            return;
        }

        if (instance.status === 'Offline') {
            addMessage(`ℹ️ Instance "${instance.name}" is already stopped.`, 'agent', 'info');
            return;
        }

        addMessage(`🛑 Stopping instance "${instance.name}"...`, 'agent', 'info');
        await wait(1500);

        const updated = instances.map(inst =>
            inst.id === instance.id
                ? { ...inst, status: 'Offline' as InstanceStatus }
                : inst
        );

        await setInstances(updated);

        addMessage(`✅ Instance "${instance.name}" has been stopped.`, 'agent', 'success');
        addNotification({
            type: 'info' as any,
            title: 'Instance Stopped',
            message: `${instance.name} is now offline`
        });
    };

    const handleRestartInstance = async (params: Record<string, any>) => {
        if (!params.instanceName) {
            addMessage('❓ Please specify which instance to restart (e.g., "Restart instance Sales-Bot-01").', 'agent', 'warning');
            return;
        }

        if (!AccessControlService.canManageInstances(user!)) {
            addMessage('⛔ Permission Denied: You cannot manage instances.', 'agent', 'error');
            return;
        }

        if (currentView !== 'INSTANCES') {
            addMessage('🧭 Navigating to Instances page...', 'agent', 'info');
            navigate('INSTANCES');
            await wait(1500);
        }

        const instance = instances.find(inst =>
            inst.name.toLowerCase().includes(params.instanceName.toLowerCase())
        );

        if (!instance) {
            addMessage(`❌ No instance found matching "${params.instanceName}".`, 'agent', 'error');
            return;
        }

        addMessage(`🔄 Restarting instance "${instance.name}"...`, 'agent', 'info');
        await wait(1000);

        // Stop
        let updated = instances.map(inst =>
            inst.id === instance.id
                ? { ...inst, status: 'Offline' as InstanceStatus }
                : inst
        );
        await setInstances(updated);

        addMessage(`⏸️ Stopped...`, 'agent', 'info');
        await wait(1500);

        // Start
        updated = instances.map(inst =>
            inst.id === instance.id
                ? { ...inst, status: 'Online' as InstanceStatus }
                : inst
        );
        await setInstances(updated);

        addMessage(`✅ Instance "${instance.name}" has been restarted!`, 'agent', 'success');
        addNotification({
            type: 'success' as any,
            title: 'Instance Restarted',
            message: `${instance.name} is back online`
        });
    };

    const handleDeleteInstance = async (params: Record<string, any>) => {
        if (!params.instanceName) {
            addMessage('❓ Please specify which instance to delete (e.g., "Delete instance Sales-Bot-01").', 'agent', 'warning');
            return;
        }

        if (!AccessControlService.canManageInstances(user!)) {
            addMessage('⛔ Permission Denied: You cannot manage instances.', 'agent', 'error');
            return;
        }

        if (currentView !== 'INSTANCES') {
            addMessage('🧭 Navigating to Instances page...', 'agent', 'info');
            navigate('INSTANCES');
            await wait(1500);
        }

        const instance = instances.find(inst =>
            inst.name.toLowerCase().includes(params.instanceName.toLowerCase())
        );

        if (!instance) {
            addMessage(`❌ No instance found matching "${params.instanceName}".`, 'agent', 'error');
            return;
        }

        addMessage(
            `⚠️ Confirm Deletion\n\nInstance: ${instance.name}\nStatus: ${instance.status}\n\n⚠️ This action cannot be undone!\n\nType "yes" to confirm or "no" to cancel.`,
            'agent',
            'warning'
        );

        setAwaitingConfirmation({
            message: 'delete_instance',
            action: async () => {
                const updated = instances.filter(inst => inst.id !== instance.id);
                await setInstances(updated);
                addMessage(`✅ Instance "${instance.name}" has been deleted.`, 'agent', 'success');
                addNotification({
                    type: 'warning' as any,
                    title: 'Instance Deleted',
                    message: `${instance.name} has been removed`
                });
            }
        });
    };

    // USER HANDLERS
    const handleUserCommand = async (intent: CommandIntent) => {
        if (intent.action === 'list') {
            await handleListUsers();
        } else {
            addMessage('❓ For users, I can: list. Try: "Show all users"', 'agent', 'warning');
        }
    };

    const handleListUsers = async () => {
        addMessage('🔐 Checking permissions...', 'agent', 'info');
        await wait(300);

        if (!AccessControlService.canManageUsers(user!)) {
            addMessage('⛔ Permission Denied: You cannot view users.', 'agent', 'error');
            return;
        }

        if (currentView !== 'USERS') {
            addMessage('🧭 Navigating to Users page...', 'agent', 'info');
            navigate('USERS');
            await wait(1500);
        }

        const total = users.length;
        const admins = users.filter(u => u.role === 'Super Admin' || u.role === 'Tenant Admin').length;
        const regularUsers = users.filter(u => u.role === 'User').length;

        addMessage(
            `👥 Users Overview:\n\n• Total: ${total}\n• Admins: ${admins}\n• Regular Users: ${regularUsers}\n\nYou are now viewing the Users page.`,
            'agent',
            'success'
        );
    };

    // TENANT HANDLERS
    const handleTenantCommand = async (intent: CommandIntent) => {
        if (intent.action === 'list') {
            await handleListTenants();
        } else {
            addMessage('❓ For tenants, I can: list. Try: "Show all tenants"', 'agent', 'warning');
        }
    };

    const handleListTenants = async () => {
        addMessage('🔐 Checking permissions...', 'agent', 'info');
        await wait(300);

        if (!AccessControlService.canAccessTenants(user!)) {
            addMessage('⛔ Permission Denied: Only Super Admins can view tenants.', 'agent', 'error');
            return;
        }

        if (currentView !== 'TENANTS') {
            addMessage('🧭 Navigating to Tenants page...', 'agent', 'info');
            navigate('TENANTS');
            await wait(1500);
        }

        const total = tenants.length;
        const active = tenants.filter(t => t.status === 'Active').length;
        const suspended = tenants.filter(t => t.status === 'Suspended').length;

        addMessage(
            `🏢 Tenants Overview:\n\n• Total: ${total}\n• Active: ${active}\n• Suspended: ${suspended}\n\nYou are now viewing the Tenants page.`,
            'agent',
            'success'
        );
    };

    // NAVIGATION HANDLER
    const handleNavigationCommand = async (command: string) => {
        const lower = command.toLowerCase();
        let targetView: ViewState | null = null;
        let viewName = '';

        if (lower.includes('dashboard')) {
            targetView = 'DASHBOARD';
            viewName = 'Dashboard';
        } else if (lower.includes('instance')) {
            targetView = 'INSTANCES';
            viewName = 'Instances';
        } else if (lower.includes('appointment')) {
            targetView = 'APPOINTMENTS';
            viewName = 'Appointments';
        } else if (lower.includes('user')) {
            targetView = 'USERS';
            viewName = 'Users';
        } else if (lower.includes('tenant')) {
            targetView = 'TENANTS';
            viewName = 'Tenants';
        } else if (lower.includes('analytics')) {
            targetView = 'ANALYTICS';
            viewName = 'Analytics';
        } else if (lower.includes('setting')) {
            targetView = 'SETTINGS';
            viewName = 'Settings';
        } else if (lower.includes('chat')) {
            targetView = 'CHAT';
            viewName = 'Chat';
        } else if (lower.includes('mcp') || lower.includes('provider')) {
            targetView = 'MCP_MARKETPLACE';
            viewName = 'MCP Providers';
        }

        if (!targetView) {
            addMessage('❓ I\'m not sure which page you want to navigate to. Try: "Go to Dashboard" or "Navigate to Appointments"', 'agent', 'warning');
            return;
        }

        // Permission checks
        if (targetView === 'INSTANCES' && !AccessControlService.canViewInstances(user!)) {
            addMessage(`⛔ Permission Denied: Your role (${user?.role}) cannot access the Instances page.`, 'agent', 'error');
            return;
        }

        if (targetView === 'USERS' && !AccessControlService.canManageUsers(user!)) {
            addMessage(`⛔ Permission Denied: Your role (${user?.role}) cannot access the Users page.`, 'agent', 'error');
            return;
        }

        if (targetView === 'TENANTS' && !AccessControlService.canAccessTenants(user!)) {
            addMessage(`⛔ Permission Denied: Only Super Admins can access the Tenants page.`, 'agent', 'error');
            return;
        }

        addMessage(`🧭 Navigating to ${viewName}...`, 'agent', 'info');
        await wait(500);
        navigate(targetView);
        await wait(800);
        addMessage(`✅ Successfully navigated to ${viewName}`, 'agent', 'success');
    };

    // SETTINGS HANDLER
    const handleSettingCommand = async (intent: CommandIntent) => {
        addMessage('⚙️ Settings management coming soon! For now, please use the Settings page manually.', 'agent', 'info');

        if (currentView !== 'SETTINGS') {
            addMessage('🧭 Navigating to Settings page...', 'agent', 'info');
            navigate('SETTINGS');
            await wait(1500);
        }
    };

    // Handle user input
    const handleSend = async () => {
        if (!input.trim() || isProcessing) return;

        const userInput = input.trim();
        setInput('');

        // Check if awaiting confirmation
        if (awaitingConfirmation) {
            if (userInput.toLowerCase() === 'yes') {
                addMessage(userInput, 'user');
                addMessage('✅ Confirmed. Processing...', 'agent', 'info');
                await wait(500);
                await awaitingConfirmation.action();
                setAwaitingConfirmation(null);
            } else if (userInput.toLowerCase() === 'no') {
                addMessage(userInput, 'user');
                addMessage('❌ Action cancelled.', 'agent', 'info');
                setAwaitingConfirmation(null);
            } else {
                addMessage(userInput, 'user');
                addMessage('❓ Please type "yes" to confirm or "no" to cancel.', 'agent', 'warning');
            }
            return;
        }

        await processCommand(userInput);
    };

    const getMessageIcon = (type?: 'info' | 'success' | 'error' | 'warning') => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-success" />;
            case 'error': return <AlertTriangle className="w-4 h-4 text-danger" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
            default: return <Info className="w-4 h-4 text-primary" />;
        }
    };

    return (
        <div className="h-full flex flex-col bg-surface">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-secondary/10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-100">PairMind Agent</h3>
                            <p className="text-xs text-slate-400">Autonomous UI Controller</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 rounded-lg p-2">
                    <Shield className="w-3 h-3" />
                    <span>Logged in as: <span className="text-slate-200 font-medium">{user?.name}</span></span>
                    <span className="text-slate-600">•</span>
                    <span>Role: <span className="text-primary font-medium">{user?.role}</span></span>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-xl p-3 ${msg.sender === 'user'
                                ? 'bg-gradient-to-r from-primary to-secondary text-white'
                                : msg.type === 'error'
                                    ? 'bg-danger/10 border border-danger/20 text-slate-200'
                                    : msg.type === 'warning'
                                        ? 'bg-warning/10 border border-warning/20 text-slate-200'
                                        : msg.type === 'success'
                                            ? 'bg-success/10 border border-success/20 text-slate-200'
                                            : 'bg-white/5 border border-white/10 text-slate-200'
                                }`}
                        >
                            {msg.sender === 'agent' && (
                                <div className="flex items-center gap-2 mb-1">
                                    {getMessageIcon(msg.type)}
                                    <span className="text-xs opacity-70">
                                        {msg.timestamp.toLocaleTimeString()}
                                    </span>
                                </div>
                            )}
                            <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
                            {msg.actions && (
                                <div className="mt-2 flex gap-2">
                                    {msg.actions.map((action, idx) => (
                                        <button
                                            key={idx}
                                            onClick={action.onClick}
                                            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            <span className="text-sm text-slate-300">Processing...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a command... (e.g., 'Create appointment tomorrow at 5 PM')"
                        className="flex-1 bg-input border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-primary/50"
                        disabled={isProcessing}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isProcessing}
                        className="px-4 py-2.5 bg-primary hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    💡 Try: "Create appointment tomorrow at 5 PM" • "Start instance Sales-Bot-01" • "Show all users"
                </p>
            </div>
        </div>
    );
};
