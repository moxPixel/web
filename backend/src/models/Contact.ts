import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../database/sequelize';

export enum ContactType {
  PARTICULIER = 'particulier',
  ENTREPRISE = 'entreprise',
  AUTRE = 'autre',
}

export enum RequestType {
  FORMATION = 'formation',
  DEVIS = 'devis',
  INFORMATION = 'information',
  AUTRE = 'autre',
}

export enum SubjectCategory {
  TECHNIQUE = 'technique',
  COMMERCIAL = 'commercial',
  PEDAGOGIQUE = 'pedagogique',
  AUTRE = 'autre',
}

export enum ContactStatus {
  PENDING = 'pending', // Demande en attente
  IN_PROGRESS = 'in_progress', // En cours de traitement
  RESPONDED = 'responded', // Répondu
  ARCHIVED = 'archived', // Archivé
}

class Contact extends Model<
  InferAttributes<Contact>,
  InferCreationAttributes<Contact>
> {
  declare id: CreationOptional<string>;
  declare contactType: ContactType;
  declare firstName?: string;
  declare lastName?: string;
  declare companyName?: string;
  declare email: string;
  declare phone?: string;
  declare requestType: RequestType;
  declare subjectCategory: SubjectCategory;
  declare message: string;
  declare consent: boolean;
  declare status: ContactStatus;
  declare response?: string;
  declare respondedAt?: Date;
  declare respondedBy?: string; // userId de l'admin qui a répondu
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Contact.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    contactType: {
      type: DataTypes.ENUM(...Object.values(ContactType)),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    requestType: {
      type: DataTypes.ENUM(...Object.values(RequestType)),
      allowNull: false,
    },
    subjectCategory: {
      type: DataTypes.ENUM(...Object.values(SubjectCategory)),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    consent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ContactStatus)),
      allowNull: false,
      defaultValue: ContactStatus.PENDING,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    respondedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'contacts',
    timestamps: true,
    underscored: false,
  }
);

export default Contact;

