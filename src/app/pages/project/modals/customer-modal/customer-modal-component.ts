import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { form, FormField, minLength, maxLength, required, disabled, pattern } from '@angular/forms/signals';
import { CreateCustomerRequest, CustomerData } from '../../../../shared/interfaces/cliente-interface';
import { FormErrorService } from '../../../../shared/services/form-error.service';
import { IconService } from '../../../../shared/services/icon.service';
import { LetrasDirective } from '../../../../shared/directives/letras-directive';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ClienteService } from '../../../../shared/services/cliente.service';
import { AlertService } from '../../../../shared/services/alert.service';
import { AppHttpError } from '../../../../shared/interfaces/error-interface';

@Component({
  selector: 'app-customer-modal',
  imports: [MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatTooltipModule, MatIconModule, FormsModule, MatFormField, FormField, LetrasDirective, MatSlideToggleModule],
  templateUrl: './customer-modal-component.html',
  styleUrl: './customer-modal-component.scss',
})

export class CustomerModal {
  private readonly iconService = inject(IconService);
  private readonly customerService = inject(ClienteService);
  private readonly dialogRef = inject(MatDialogRef<CustomerModal>);
  private readonly alertService = inject(AlertService);
  
  readonly data: CustomerData | undefined = inject(MAT_DIALOG_DATA);
  readonly isActive = signal<boolean>(this.data?.estado === 'Activo');
  readonly statusText = computed(() => this.isActive() ? 'Activo' : 'Inactivo');
  readonly errorIconPath = computed(() => this.iconService.getIconPath('error')());
  public errorService = inject(FormErrorService);
  readonly backendErrors = signal<Record<string, string[]>>({});
  readonly isReadOnly = signal<boolean>((this.data as any)?.isReadOnly === true);
  readonly isSaving = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(!!this.data?.id);

  private readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  readonly customerModel = signal<CustomerData>(
    this.data?.id ? {
      nombre_cliente: this.data.nombre_cliente || '',
      ruc_cliente: this.data.ruc_cliente || '',
      email: this.data.email || '',
      telefono: this.data.telefono || '',
      direccion: this.data.direccion || '',
      estado: this.data.estado || 'Inactivo',
    } : {
      nombre_cliente: '',
      ruc_cliente: '',
      email: '',
      telefono: '',
      direccion: '',
      estado: 'Inactivo',
    }
  );

  constructor() {
    if (this.data?.id) {
      this.customerModel.set({
        nombre_cliente: this.data.nombre_cliente || '',
        ruc_cliente: this.data.ruc_cliente || '',
        email: this.data.email || '',
        telefono: this.data.telefono || '',
        direccion: this.data.direccion || '',
        estado: this.data.estado || 'Inactivo',
      });
      this.isActive.set(this.data.estado === 'Activo');
    }
  }

  readonly customerForm = form(this.customerModel, (fieldPath) => {
    required(fieldPath.nombre_cliente, { message: 'El nombre es requerido.' });
    minLength(fieldPath.nombre_cliente, 3, { message: 'El nombre debe tener al menos 3 caracteres.' });
    maxLength(fieldPath.nombre_cliente, 40, { message: 'El nombre debe tener al menos 30 caracteres.' });
    required(fieldPath.ruc_cliente, { message: 'El RUC es requerido.' });
    minLength(fieldPath.ruc_cliente, 11, { message: 'El RUC debe tener al menos 11 caracteres.' });
    maxLength(fieldPath.ruc_cliente, 11, { message: 'El RUC debe tener exactamente 11 caracteres.' });
    required(fieldPath.email, { message: 'El email es requerido.' });
    pattern(fieldPath.email, this.EMAIL_REGEX, { message: 'El email es inválido.' });
    required(fieldPath.telefono, { message: 'El teléfono es requerido.' });
    required(fieldPath.direccion, { message: 'La dirección es requerida.' });
    this.setupDisabledFields(fieldPath);

  });


  private setupDisabledFields(fieldPath: any): void {
    disabled(fieldPath.nombre_cliente, () => this.isReadOnly());
    disabled(fieldPath.ruc_cliente, () => this.isReadOnly());
    disabled(fieldPath.email, () => this.isReadOnly());
    disabled(fieldPath.telefono, () => this.isReadOnly());
    disabled(fieldPath.direccion, () => this.isReadOnly());
    disabled(fieldPath.estado, () => this.isReadOnly());
  }


  customerNameError = this.errorService.createFieldTracker(this.customerForm.nombre_cliente, this.backendErrors, 'nombre_cliente');
  customerRucError = this.errorService.createFieldTracker(this.customerForm.ruc_cliente, this.backendErrors, 'ruc_cliente');
  customerEmailError = this.errorService.createFieldTracker(this.customerForm.email, this.backendErrors, 'email');
  customerPhoneError = this.errorService.createFieldTracker(this.customerForm.telefono, this.backendErrors, 'telefono');
  customerAddressError = this.errorService.createFieldTracker(this.customerForm.direccion, this.backendErrors, 'direccion');

  onSave(event: Event){
    console.log("Saving customer...");
    event.preventDefault();
    if (this.isReadOnly()) return;
    this.backendErrors.set({});

    if (this.customerForm().invalid()) {
      this.markAllFieldsAsTouched();
      return;
    }
    this.isSaving.set(true);
    const payload = this.preparePayload();
    const apiRequest = this.mapToApiRequest(payload);

    if (this.isEditMode()) {
      this.updateCustomer(apiRequest);
    } else {
      this.createCustomer(apiRequest);
    }
  }

  private preparePayload(): CustomerData {
    const customerData = this.customerModel();
    return {
      nombre_cliente: customerData.nombre_cliente.trim().toUpperCase(),
      ruc_cliente: customerData.ruc_cliente.trim(),
      email: customerData.email.trim(),
      telefono : customerData.telefono.trim(),
      direccion: customerData.direccion.trim().toUpperCase(),
      estado: customerData.estado
    };
  }
  

  private createCustomer(apiRequest: CreateCustomerRequest): void {
    this.customerService.createCustomer(apiRequest).subscribe({
      next: (response) => {
        this.handleSuccess(response);
        this.alertService.success('Rol creado exitosamente.',1500);
      },
      error: (err: AppHttpError) => this.manejarErroresBackend(err)
    });
  }

  private updateCustomer(apiRequest: CreateCustomerRequest): void {
    this.customerService.updateCustomer(this.data?.id || 0, apiRequest).subscribe({
      next: (response) => {
        this.handleSuccess(response);
        this.alertService.success('Rol actualizado exitosamente.',1500);
      },
      error: (err: AppHttpError) => this.manejarErroresBackend(err)
    });
  }

  private handleSuccess(response: any): void {
    this.isSaving.set(false);
    this.dialogRef.close(response);
  }
  
  private manejarErroresBackend(err: AppHttpError): void {
    this.isSaving.set(false);
    this.alertService.error(err.mensajeGeneral || 'Ocurrió un error al procesar los datos.');
  }
  
  private mapToApiRequest(customerData: CustomerData): CreateCustomerRequest {
    return {
      nombre_cliente: customerData.nombre_cliente,
      ruc_cliente: customerData.ruc_cliente,
      email: customerData.email,
      telefono: customerData.telefono,
      direccion: customerData.direccion,
      estado: customerData.estado =='Activo'
    };
  }

  private markAllFieldsAsTouched(): void {
    this.customerForm.nombre_cliente().markAsTouched();
    this.customerForm.ruc_cliente().markAsTouched();
    this.customerForm.email().markAsTouched();
    this.customerForm.telefono().markAsTouched();
    this.customerForm.direccion().markAsTouched();
    this.customerForm.estado().markAsTouched();
  }

}
