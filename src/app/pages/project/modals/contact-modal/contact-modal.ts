import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { form, FormField, min, required, pattern } from '@angular/forms/signals';
import { MatSelectModule } from '@angular/material/select';
import { ContactData, CreateContactRequest } from '../../../../shared/interfaces/contacto-interface';
import { FormErrorService } from '../../../../shared/services/form-error.service';
import { FormsModule } from '@angular/forms';
import { IconService } from '../../../../shared/services/icon.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { ClienteService } from '../../../../shared/services/cliente.service';
import { CustomerData } from '../../../../shared/interfaces/cliente-interface';
import { ContactService } from '../../../../shared/services/contact-service';
import { AlertService } from '../../../../shared';
import { AppHttpError } from '../../../../shared/interfaces/error-interface';
import { LetrasDirective } from '../../../../shared/directives/letras-directive';
import { NumerosDirective } from '../../../../shared/directives/numeros-directive';

@Component({
  selector: 'app-contact-modal',
  imports: [MatDialogModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatTooltipModule, MatSelectModule, FormField, MatFormField, FormsModule, MatSlideToggleModule, MatInputModule, LetrasDirective, NumerosDirective ],
  templateUrl: './contact-modal.html',
  styleUrl: './contact-modal.scss',
})

export class ContactModal {
  readonly data: ContactData | undefined = inject(MAT_DIALOG_DATA);
  public errorService = inject(FormErrorService);
  private readonly iconService = inject(IconService);
  private readonly customerService = inject(ClienteService);
  private readonly contactService = inject(ContactService);
  private readonly alertService = inject(AlertService);
  private readonly dialogRef = inject(MatDialogRef<ContactModal>);
  private readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  readonly customers = signal<CustomerData[]>([]);
  readonly backendErrors = signal<Record<string, string[]>>({});
  readonly errorIconPath = computed(() => this.iconService.getIconPath('error')());
  readonly isEditMode = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  readonly contactModel = signal<ContactData>(
    this.data?.id_contacto ? {
      area: this.data.area || '',
      nombres: this.data.nombres || '',
      apellido_paterno: this.data.apellido_paterno || '',
      apellido_materno: this.data.apellido_materno || '',
      email_contacto: this.data.email_contacto || '',
      telefono_contacto: this.data.telefono_contacto || '',
      estado: this.data.estado ?? false,
      id_cliente: this.data.id_cliente,
      nombre_cliente: this.data.nombre_cliente || '',
    } : {
      area: '',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      email_contacto: '',
      telefono_contacto: '',
      estado: false,
      id_cliente: 0,
      nombre_cliente: '',
    }
  );
  
  constructor() {
    if (this.data?.id_contacto) {
      this.isEditMode.set(true);
      this.loadCustomers();
    }
     
  }
  readonly contactForm = form(this.contactModel, (fieldPath) => {
    required(fieldPath.nombres, { message: 'El nombre es requerido.' });
    required(fieldPath.area, { message: 'El área es requerida.' });
    required(fieldPath.apellido_paterno, { message: 'El apellido paterno es requerido.' });
    required(fieldPath.apellido_materno, { message: 'El apellido materno es requerido.' });
    required(fieldPath.email_contacto, { message: 'El email es requerido.' });
    required(fieldPath.telefono_contacto, { message: 'El teléfono es requerido.' });
    min(fieldPath.id_cliente, 1, { message: 'El cliente es requerido.' });
    pattern(fieldPath.telefono_contacto, /^\d{7,9}$/, { message: 'El teléfono debe contener entre 7 y 9 dígitos numéricos.' });
    pattern(fieldPath.email_contacto, this.EMAIL_REGEX, { message: 'El email no es válido.' });
  });

  contactNameError = this.errorService.createFieldTracker(this.contactForm.nombres, this.backendErrors, 'nombres');
  contactPaternalSurnameError = this.errorService.createFieldTracker(this.contactForm.apellido_paterno, this.backendErrors, 'apellido_paterno');
  contactMaternalSurnameError = this.errorService.createFieldTracker(this.contactForm.apellido_materno, this.backendErrors, 'apellido_materno');
  contactAreaError = this.errorService.createFieldTracker(this.contactForm.area, this.backendErrors, 'area');
  contactEmailError = this.errorService.createFieldTracker(this.contactForm.email_contacto, this.backendErrors, 'email_contacto');
  contactPhoneError = this.errorService.createFieldTracker(this.contactForm.telefono_contacto, this.backendErrors, 'telefono_contacto');
  
  loadCustomers(): void {
    this.customerService.getCustomers({ page: 1, page_size: 100 }).subscribe({
      next: (response) => {
        const mappedCustomers = response.results?.map(customer => ({
          id: customer.id_cliente,
          nombre_cliente: customer.nombre_cliente,
          ruc_cliente: customer.ruc_cliente,
          email: customer.email,
          telefono: customer.telefono,
          direccion: customer.direccion || '',
          estado: customer.estado ? 'Activo' : 'Inactivo',
          
        })) || [];
        this.customers.set(mappedCustomers);
      },
      error: (error) => {
        console.log('Error al cargar clientes', error);
      }
    });
  }
  
  private preparePayload(): CreateContactRequest { 
    return {
      nombres: this.contactModel().nombres.trim().toUpperCase(),
      area: this.contactModel().area.trim().toUpperCase(),
      apellido_paterno: this.contactModel().apellido_paterno.trim().toUpperCase(),
      apellido_materno: this.contactModel().apellido_materno.trim().toUpperCase(),
      email_contacto: this.contactModel().email_contacto.trim().toLowerCase(),
      telefono_contacto: this.contactModel().telefono_contacto.trim(),
      estado: this.contactModel().estado, 
      id_cliente: this.contactModel().id_cliente,
    }
  };

  onSave(event: Event){
    event.preventDefault();
    this.isSaving.set(true);
    this.backendErrors.set({});
    if (this.contactForm().invalid()) {
      this.markAllFieldsAsTouched();
      this.isSaving.set(false);
      return;
    }
    const payload = this.preparePayload();

    if (this.isEditMode()) {
      this.updateContact(payload);
    } else {
      this.createContact(payload);
    }
  }

  private markAllFieldsAsTouched(): void {
    this.contactForm.nombres().markAsTouched();
    this.contactForm.area().markAsTouched();
    this.contactForm.apellido_paterno().markAsTouched();
    this.contactForm.apellido_materno().markAsTouched();
    this.contactForm.email_contacto().markAsTouched();
    this.contactForm.telefono_contacto().markAsTouched();
    this.contactForm.estado().markAsTouched();
    this.contactForm.id_cliente().markAsTouched();
  }

  private updateContact(apiRequest: CreateContactRequest): void {
    this.contactService.updateContact(this.data?.id_contacto || 0, apiRequest).subscribe({
      next: (response) => {
        this.isSaving.set(false);
        this.dialogRef.close(response);
        this.alertService.success('Contacto actualizado exitosamente.',1500);
      },
      error: (err: AppHttpError) => {
        this.isSaving.set(false);
        this.alertService.error(err.mensajeGeneral || 'Ocurrió un error al procesar los datos.');
      }
    });
  }

  private createContact(apiRequest:CreateContactRequest): void {
    this.contactService.createContact(apiRequest).subscribe({
      next: (response) => {
        this.isSaving.set(false);
        this.dialogRef.close(response);
        this.alertService.success('Contacto creado exitosamente.',1500);
      },
      error: (err: AppHttpError) => {
        this.isSaving.set(false);
        this.alertService.error(err.mensajeGeneral || 'Ocurrió un error al procesar los datos.');
      }
    });
  }
  
}
  