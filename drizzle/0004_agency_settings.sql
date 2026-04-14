CREATE TABLE `agencySettings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `agencyName` varchar(255) NOT NULL DEFAULT 'Imobiliária',
  `agencySlogan` varchar(255),
  `agencyCnpj` varchar(20),
  `agencyPhone` varchar(32),
  `agencyEmail` varchar(320),
  `agencyAddress` text,
  `agencyPixKey` varchar(128),
  `agencyBank` varchar(128),
  `agencyBankAgency` varchar(20),
  `agencyBankAccount` varchar(32),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `agencySettings_id` PRIMARY KEY(`id`)
);
