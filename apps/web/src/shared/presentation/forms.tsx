import { Check, Eye, EyeOff, Search } from 'lucide-react';
import { cloneElement, isValidElement, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
export function Field({ label, children, hint, className = '' }: {
    label: string;
    children: ReactNode;
    hint?: string;
    className?: string;
}) {
    const id = useId();
    const input = isValidElement<{
        id?: string;
        'aria-describedby'?: string;
    }>(children)
        ? cloneElement(children, { id, ...(hint ? { 'aria-describedby': `${id}-hint` } : {}) }) : children;
    return <div className={`field ${className}`}><label className="field-label" htmlFor={id}>{label}</label>{input}{hint && <span id={`${id}-hint`} className="field-hint">{hint}</span>}</div>;
}
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
    const [visible, setVisible] = useState(false);
    const toggleLabel = visible ? 'Ocultar contraseña' : 'Mostrar contraseña';
    return <div className="password-input"><input {...props} type={visible ? 'text' : 'password'}/><button type="button" className="icon-button password-toggle" aria-label={toggleLabel} aria-pressed={visible} title={toggleLabel} onClick={() => setVisible(value => !value)}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>;
}
export function SearchInput({ value, onChange, placeholder = 'Buscar…' }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) { return <label className="search-field"><Search size={20}/><span className="sr-only">{placeholder}</span><input type="search" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}/></label>; }
export function Switch({ checked, onChange, disabled, label }: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    label: string;
}) { return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch ${checked ? 'on' : ''}`} disabled={disabled} onClick={onChange}><span>{checked && <Check size={12}/>}</span></button>; }
