import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
export function PageHeading({ title, subtitle, children }: {
    title: string;
    subtitle?: string;
    children?: ReactNode;
}) { return <div className="page-heading"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{children}</div>; }
export function Card({ title, subtitle, children, className = '' }: {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
}) { return <section className={`card ${className}`}>{title && <div className="card-heading"><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>}{children}</section>; }
export function FormTop({ title, back, saving, readonly = false, saveLabel = 'Guardar', children }: {
    title: string;
    back?: string;
    saving?: boolean;
    readonly?: boolean;
    saveLabel?: string;
    children?: ReactNode;
}) { return <div className="form-top"><div className="form-title">{back && <Link to={back} className="button icon-button" aria-label="Volver"><ArrowLeft size={16}/></Link>}<h1>{title}</h1></div><div className="actions">{children}{back && !readonly && <Link to={back} className="button">Descartar</Link>}{!readonly && <button className="button primary" disabled={saving} type="submit">{saving && <LoaderCircle size={16} className="spin"/>}{saving ? 'Guardando…' : saveLabel}</button>}</div></div>; }
