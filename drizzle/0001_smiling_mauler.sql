CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`tenantId` int NOT NULL,
	`ownerId` int NOT NULL,
	`status` enum('active','expired','terminated','pending') NOT NULL DEFAULT 'pending',
	`startDate` bigint NOT NULL,
	`endDate` bigint NOT NULL,
	`rentValue` decimal(12,2) NOT NULL,
	`adminFeePercent` decimal(5,2) NOT NULL,
	`condoFee` decimal(12,2),
	`iptuValue` decimal(12,2),
	`paymentDueDay` int NOT NULL DEFAULT 10,
	`adjustmentIndex` varchar(32) DEFAULT 'IGPM',
	`guaranteeType` enum('deposit','guarantor','insurance','none') DEFAULT 'none',
	`guaranteeDetails` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('property','contract','owner','tenant','inspection','maintenance') NOT NULL,
	`entityId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512),
	`mimeType` varchar(128),
	`uploadedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspectionItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inspectionId` int NOT NULL,
	`area` varchar(128) NOT NULL,
	`item` varchar(255) NOT NULL,
	`condition` enum('excellent','good','fair','poor','damaged') NOT NULL DEFAULT 'good',
	`notes` text,
	`photos` json,
	CONSTRAINT `inspectionItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`contractId` int,
	`inspectorId` int,
	`type` enum('entry','exit','periodic','maintenance') NOT NULL DEFAULT 'periodic',
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`scheduledDate` bigint NOT NULL,
	`completedDate` bigint,
	`generalCondition` enum('excellent','good','fair','poor'),
	`overallNotes` text,
	`photos` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`contractId` int,
	`requestedById` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('plumbing','electrical','structural','painting','appliance','general','other') NOT NULL DEFAULT 'general',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('open','in_progress','waiting_parts','completed','cancelled') NOT NULL DEFAULT 'open',
	`photos` json,
	`cost` decimal(12,2),
	`resolvedAt` bigint,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ownerTransfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`paymentId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`status` enum('pending','completed') NOT NULL DEFAULT 'pending',
	`transferredAt` bigint,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ownerTransfers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `owners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`cpfCnpj` varchar(20),
	`address` text,
	`bankName` varchar(128),
	`bankAgency` varchar(20),
	`bankAccount` varchar(32),
	`pixKey` varchar(128),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `owners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`tenantId` int NOT NULL,
	`ownerId` int NOT NULL,
	`referenceMonth` varchar(7) NOT NULL,
	`dueDate` bigint NOT NULL,
	`rentAmount` decimal(12,2) NOT NULL,
	`condoAmount` decimal(12,2),
	`iptuAmount` decimal(12,2),
	`totalAmount` decimal(12,2) NOT NULL,
	`adminFeeAmount` decimal(12,2) NOT NULL,
	`ownerTransferAmount` decimal(12,2) NOT NULL,
	`status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`paidAt` bigint,
	`paidAmount` decimal(12,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` enum('apartment','house','commercial','land','other') NOT NULL DEFAULT 'apartment',
	`status` enum('available','rented','maintenance') NOT NULL DEFAULT 'available',
	`addressStreet` varchar(255),
	`addressNumber` varchar(20),
	`addressComplement` varchar(128),
	`addressNeighborhood` varchar(128),
	`addressCity` varchar(128),
	`addressState` varchar(64),
	`addressZip` varchar(16),
	`bedrooms` int DEFAULT 0,
	`bathrooms` int DEFAULT 0,
	`parkingSpaces` int DEFAULT 0,
	`area` decimal(10,2),
	`rentValue` decimal(12,2),
	`condoFee` decimal(12,2),
	`iptuValue` decimal(12,2),
	`description` text,
	`photos` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`cpfCnpj` varchar(20),
	`address` text,
	`emergencyContact` varchar(255),
	`emergencyPhone` varchar(32),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_ownerId_owners_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `owners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_uploadedById_users_id_fk` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inspectionItems` ADD CONSTRAINT `inspectionItems_inspectionId_inspections_id_fk` FOREIGN KEY (`inspectionId`) REFERENCES `inspections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inspections` ADD CONSTRAINT `inspections_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inspections` ADD CONSTRAINT `inspections_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inspections` ADD CONSTRAINT `inspections_inspectorId_users_id_fk` FOREIGN KEY (`inspectorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenances` ADD CONSTRAINT `maintenances_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenances` ADD CONSTRAINT `maintenances_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenances` ADD CONSTRAINT `maintenances_requestedById_users_id_fk` FOREIGN KEY (`requestedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ownerTransfers` ADD CONSTRAINT `ownerTransfers_ownerId_owners_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `owners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ownerTransfers` ADD CONSTRAINT `ownerTransfers_paymentId_payments_id_fk` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `owners` ADD CONSTRAINT `owners_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_ownerId_owners_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `owners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `properties` ADD CONSTRAINT `properties_ownerId_owners_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `owners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;